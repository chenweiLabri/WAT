const winston = require('winston');
const MongoClient = require('mongodb').MongoClient;
const arrayShuffle = require('array-shuffle');
const Promise = require('bluebird');
const wat_action = require('wat_action_nightmare');

const database = require('./database.js');
const updator = require('./update_res.js');


function calculatePro(dbUrl) {
    winston.info(`Calculate probability Step table in ${dbUrl}`);
    return new Promise((resolve, reject) => {

        MongoClient.connect(dbUrl)
            .then(db => {
                db.collection('step', (err, stepCollection) => {
                    if (err) {
                        winston.error(err);
                        db.close();
                    } else {
                        stepCollection.find().toArray()
                            .then(stepArray => {

                                var N = stepArray.length;
           
                                var promiseList = [];
                                var pList = [];
                                var pSum = 0;

                                console.log("N "+ N);
                                //1.refresh all p 
                                
                                for (let s = 0; s < stepArray.length; s++) {

                                    var p = calculate(stepArray[s], N);
                                    console.log("p "+ p);                           
                                    pSum = pSum + p;
                                    stepArray[s].probability = p;
                                }

                                console.log("Psum: " + pSum);

                                //2.uniformization
                                for (let m = 0; m < stepArray.length; m++) {

                                   // save stepItem in the step table
                                    // var stepItem = {};
                                    // stepItem.probability = stepArray[m].probability;
                                    // stepItem.sumPro = pSum;
                                    // stepItem.uniformPro = stepArray[m].probability / pSum;
                         
                                    // return pList to next step
                                   stepArray[m].sumPro = pSum;
                                   stepArray[m].uniformPro = stepArray[m].probability / pSum;
                                   pList.push(stepArray[m]);

                                   console.log(stepArray[m]);
                                    promiseList.push(
                                        stepCollection.findOneAndReplace(
                                            { 'aid': stepArray[m].aid },
                                            {
                                                $set: stepArray[m]
                                             },
                                            { upsert: true })
                                    );

                                }


                                Promise.all(promiseList).then(() => {
                                    console.log("update all step probabilities");
                                    db.close();
                                    resolve();
                                })


                                resolve(pList);
                            }).catch(err => {
                                winston.info(err);
                                db.close();
                            });

                    }
                })

            }).catch(err => {
                winston.info(err);
                reject();
            });

    })
}

function calculate(stepItem, N) {

    var a = 1 / N;
    var b1 = -1;
    var b2 = -1 / (2 * N);
    var b3 = 1 / (2 * N);
    var b4 = 1 / (2 * N);

    var p = a + b1 * stepItem.FPCA + b2 * stepItem.TPCA_OUT + b3 * stepItem.TPCA_IN_TS + b4 * stepItem.TPCA_IN_TF;

    // console.log(a + " " + b1 + " " + b2 + " " + b3 + " " + b4 + " " + p);
    return p;
}

function getNextScenarios(dbUrl, scenario_str, runList, randomLocation, flag) {

    if (flag === "TFIO") {
        return getTFIOScenarios(dbUrl, scenario_str, runList, randomLocation);
    } else if (flag === "END") {
        return getENDScenarios(dbUrl, scenario_str, runList, randomLocation);
    }

}

function getTFIOScenarios(dbUrl, scenario_str, runList, randomLocation) {
    var selectNum = randomLocation.length;

    // shuffle the array first
    // sort the pList according to the probability

    //get the top selectNumber
    //Randomize the order to be impartial for all same probability actions 
    var tempList = arrayShuffle(runList).sort(compare).splice(0, selectNum); 
    var aList = arrayShuffle(tempList);

    let noise_num = 0;

    return new Promise((resolve, reject) => {
        var sidList = [];

        return synchronousLoop(function () {
            // Condition for stopping
            return noise_num < aList.length;
        }, function () {
            // The function to run, should return a promise
            return new Promise(function (resolve, reject) {
                // Arbitrary 250ms async method to simulate async process
                setTimeout(function () {

                    var promiseList = [];

                    promiseList.push(gen_TF(dbUrl, scenario_str, aList[noise_num].action, randomLocation[noise_num], aList[noise_num].aid).then((sid) => {
                        sidList.push(sid);
                    }));
                    promiseList.push(gen_IO(dbUrl, scenario_str, aList[noise_num].action, randomLocation[noise_num], aList[noise_num].aid).then((sid) => {
                        sidList.push(sid);
                    }));

                    Promise.all(promiseList).then(() => {
                        resolve();
                        console.log("finish generate scenarios for 1 action");
                        noise_num++;
                    })


                }, 2000);
            });
        }).then(() => {
            console.log("finish TF IO scenarios ");
            //this is the resolve for upper promise
            resolve(sidList);
        })

    })
}

function getENDScenarios(dbUrl, scenario_str, runList, randomLocation) {


    return database.read_run_collection(dbUrl, runList).then((TIruns) => {

        return new Promise((resolve, reject) => {
            console.log(TIruns);
            // 1. update step part 1: TFIO
            var firstPromise = updator.update_TFIO_step(dbUrl, TIruns);

            // 2. generate end scenario
            var secondPromise = gen_end_scenario(dbUrl, scenario_str, TIruns)

            Promise.all([firstPromise, secondPromise]).then((value) => {
                console.log("complete update TFIO and end scenarios");

                // sidList is the return value of the secondPromise
                console.log(value);
                var sidList = value[1];
                console.log(sidList);
                resolve(sidList);
            });
        })

    });

}

function gen_TF(dbUrl, scenario_str, action, abid, aid) {

    var scenario_base = new wat_action.Scenario(scenario_str);
    scenario_base.actions.splice(abid + 1, 0, action);

    var addnoiseAction = scenario_base.actions.slice(0, abid + 2);

    var scenarioJson = JSON.stringify(addnoiseAction, null, 2);

    // console.log(scenarioJson);

    var scenario_noise = new wat_action.Scenario(JSON.parse(scenarioJson));

    return database.write_noise_scenario(dbUrl, scenario_noise, abid, aid, "TF");

}

function gen_IO(dbUrl, scenario_str, action, abid, aid) {

    var scenario_base = new wat_action.Scenario(scenario_str);
    scenario_base.actions.splice(abid + 1, 0, action);

    var addnoiseAction = scenario_base.actions.splice(0, abid + 3);
    var scenarioJson = JSON.stringify(addnoiseAction, null, 2);

    //   console.log(scenarioJson);

    var scenario_noise = new wat_action.Scenario(JSON.parse(scenarioJson));

    return database.write_noise_scenario(dbUrl, scenario_noise, abid, aid, "IO");

}

function gen_end_scenario(dbUrl, scenario_str, TIruns) {
    var sidList = [];
    var endList = findEndActions(TIruns);
    if (endList.length !== 0) {
        console.log("------end list-----------")
        console.log(endList);


        return new Promise((resolve, reject) => {
            gen_END(dbUrl, scenario_str, endList).then((sid) => {
                sidList.push(sid);
                resolve(sidList);
            });
        })

    } else {
        // endList is []
        return endList;
    }
}

function findEndActions(TIruns) {
    var endList = [];

    for (let i = 0; i < TIruns.length; i++) {

        var run = TIruns[i];

        var gotoEnd = true;

        for (let j = 0; j < run.isSuccess.length; j++) {
            if (run.flag[j] === "TF" | run.flag[j] === "IO") {
                if (run.isSuccess[j] === false) {
                    gotoEnd = false;
                }
            }
        }

        // if (gotoEnd) {
        endList.push(run);
        // }
    }



    return endList;
}

function gen_END(dbUrl, scenario_str, endList) {

    var abidList = [];
    var aidList = [];
    for (let i = 0; i < endList.length; i++) {
        abidList.push(endList[i].abid);
        aidList.push(endList[i]._id);
    }

    // sort the abidList
    abidList.sort(function (a, b) {
        return a - b;
    });

    // specify add locations
    console.log(abidList);

    var scenario_base = new wat_action.Scenario(scenario_str);

    for (let j = 0; j < abidList.length; j++) {
        scenario_base.actions.splice(abidList[j] + j + 1, 0, endList[j].action);
    }

    var scenarioJson = JSON.stringify(scenario_base.actions, null, 2);

    // console.log(scenarioJson);

    var scenario_noise = new wat_action.Scenario(JSON.parse(scenarioJson));

    return database.write_noise_scenario(dbUrl, scenario_noise, abidList, aidList, "END")

}

// sort by value
function compare(a, b) {
    return b.probability - a.probability;
};

function synchronousLoop(condition, action) {
    var resolver = Promise.defer();

    var loop = function () {
        if (!condition()) return resolver.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };

    process.nextTick(loop);

    return resolver.promise;
};

exports.calculatePro = calculatePro;
exports.getNextScenarios = getNextScenarios;