
function crawl(dbUrl, url, baseId, index){

	const Nightmare = require('nightmare');
	const htmlAnalysis = require('./htmlAnalysis.js');
	const watlib = require('wat_action_nightmare');
	var nightmare = new Nightmare({ show: false });
	var database = require('./database.js');
	var scenario = new watlib.Scenario();

	nightmare.goto(url).screenshot()
	.then(() => {
		return nightmare.evaluate(htmlAnalysis).end();
	}).then(analysisResult => {

		// scenario.addAction(new watlib.GotoAction(analysisResult.URL));
		// scenario.addAction(new watlib.ScrollToAction(100, 200));
		// scenario.addAction(new watlib.WaitAction(1000));
		// scenario.addAction(new watlib.BackAction());

		analysisResult.inputText.forEach(inputText => {
			scenario.addAction(new watlib.TypeAction(inputText.selector,"inputText"));
		});

		analysisResult.inputPassword.forEach(inputPassword => {
			scenario.addAction(new watlib.TypeAction(inputPassword.selector,"inputPassword"));
		});

		analysisResult.textarea.forEach(textarea => {
			scenario.addAction(new watlib.TypeAction(textarea.selector,"textarea"));
		});

		// analysisResult.checkbox.forEach(checkbox => {
		// 	scenario.addAction(new watlib.CheckAction(checkbox.selector));
		// });

		// analysisResult.selectorsA.forEach(selectorsA => {
		// 	scenario.addAction(new watlib.MouseOverAction(selectorsA.selector));
		// });

		analysisResult.selectorsA.forEach(selectorsA => {
			scenario.addAction(new watlib.ClickAction(selectorsA.selector));
		});

		analysisResult.inputToClick.forEach(inputToClick => {
			scenario.addAction(new watlib.ClickAction(inputToClick.selector));
		});

		// scenarioJson = JSON.stringify(JSON.parse(scenario.toJSON()),null,2);
		// console.log("show the crawl actions");
		// console.log(scenario);

		database.write_candidate_action(dbUrl, baseId, index, scenario);

		
	}).catch(err => {
		console.log("err in crawl_action ! crawl");
		console.log(err);
	});

}

exports.crawl = crawl;