'use strict';
var utils = require('./utils');

module.exports.getOverallCodeCoverage = function(deployDetails) {
	if (deployDetails && deployDetails.runTestResult && deployDetails.runTestResult.codeCoverage) {
		var coverages = utils.ensureArray(deployDetails.runTestResult.codeCoverage);
		var total = coverages.filter(function(coverage) {
			// exclude empty classes
			return coverage.numLocations && parseInt(coverage.numLocations) > 0;
		}).reduce(function(acc, coverage) {
			return {
				numLocations: acc.numLocations + parseInt(coverage.numLocations),
				numLocationsNotCovered: acc.numLocationsNotCovered + parseInt(coverage.numLocationsNotCovered)
			};
		}, {
			numLocations: 0,
			numLocationsNotCovered: 0
		});
		if (total.numLocations) {
			return (1 - (total.numLocationsNotCovered / total.numLocations));
		}
	}
	return undefined;
};

module.exports.formatOverallCodeCoverage = function(overallCodeCoverage) {
	return 'Overall Code Coverage: ' + (typeof overallCodeCoverage === 'number' ? overallCodeCoverage.toLocaleString('en-us', {
		style: 'percent'
	}) : overallCodeCoverage);
};

module.exports.formatCoverageCSV = function(deployDetails) {
	var lines = [];
	if (deployDetails && deployDetails.runTestResult && deployDetails.runTestResult.codeCoverage) {
		var coverages = utils.ensureArray(deployDetails.runTestResult.codeCoverage);
		lines.push(["Type", "Name", "Percent", "LinesNotCovered", "Lines"].join(","));
		coverages.filter(function(coverage) {
			// exclude empty classes
			return coverage.numLocations && parseInt(coverage.numLocations) > 0;
		}).forEach(function(coverage) {
			var coveragePercentage = (1 - (parseInt(coverage.numLocationsNotCovered) / parseInt(coverage.numLocations))) * 100;
			lines.push([
				coverage.type,
				coverage.name,
				coveragePercentage,
				coverage.numLocationsNotCovered,
				coverage.numLocations
			].join(","));
		});
	}
	return lines.join("\n");
};
