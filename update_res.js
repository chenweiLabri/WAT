const Promise = require('bluebird');

var database = require('./database.js');


function update_TFIO_step(dbUrl, TIruns) {
	
	return new Promise(function (resolve, reject) {
	var step_num = 0;

	return synchronousLoop(function () {
			// Condition for stopping
			return step_num < TIruns.length;
		}, function () {
			// The function to run, should return a promise
			return new Promise(function (resolve, reject) {
				// Arbitrary 250ms async method to simulate async process
				setTimeout(function () {

					// Print out the sum thus far to show progress
					var final = gen_bugType_TI(TIruns[step_num]);

					// console.log("-------final TF IO----------");
					// console.log(final);

					if (final.type !== null) {
						database.write_TI_step(dbUrl, final);
					}
					
					step_num++;
					resolve();
				}, 100);
			});
		}).then(()=>{
			resolve("finish save TFIO steps");
		})

	})
}

function gen_bugType_TI(result) {
	var TF, IO;
	console.log("gen_bugType_TI collect result102"+result);

	switch (result.flag[0]) {
		case "TF": TF = result.isSuccess[0]; break;
		case "IO": IO = result.isSuccess[0]; break;
	}

	switch (result.flag[1]) {
		case "TF": TF = result.isSuccess[1]; break;
		case "IO": IO = result.isSuccess[1]; break;
	}

	var type = null;

	if (TF === false) {
		type = "FPCA";
	} else {
		if (IO === false) {
			type = "TPCA_OUT"
		}
	}

	result.type = type;

	return result;
}

function update_END_step(dbUrl, runEND) {
	
	console.log(runEND);

	return database.read_end_run(dbUrl, runEND).then((endCombine) => {
		
		return new Promise(function (resolve, reject) {
			var step_num = 0;
		
			return synchronousLoop(function () {
					// Condition for stopping
					return step_num < endCombine.length;
				}, function () {
					// The function to run, should return a promise
					return new Promise(function (resolve, reject) {
						// Arbitrary 250ms async method to simulate async process
						setTimeout(function () {
		
							// Print out the sum thus far to show progress
							var final = gen_bugType_END(endCombine[step_num]);
		
							// console.log("-------final end----------");
							// console.log(final);
		
							if (final.type !== null) {
								database.write_END_step(dbUrl, final);
							}
							
							step_num++;
							resolve();
						}, 100);
					});
				}).then(()=>{
					resolve("finish save END steps");
				})
				
	});
	
 })

}

function gen_bugType_END(result) {

	var type = null;

	if (result.flag === "END") {

		if (result.isSuccess === false) {
			type = "TPCA_IN_TF";
		} else {
			type = "TPCA_IN_TS";
		}

	}
	
	result.type = type;

	return result;
}

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

module.exports.update_TFIO_step = update_TFIO_step;
module.exports.update_END_step = update_END_step;