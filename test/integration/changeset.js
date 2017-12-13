"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");

describe("force-dev-tool changeset", function() {
	var fdt = path.resolve(__dirname, "..", "..", "bin", "cli");
	it("should fail to create a changeset if there is no src/package.xml", function() {
		this.slow(1000);
		this.timeout(2000);
		var tmpobj = tmp.dirSync();
		var changesetCreateCmd = child.spawnSync(
			"node", [fdt, "changeset", "create", "empty"], {
				cwd: tmpobj.name
			}
		);
		assert.deepEqual(changesetCreateCmd.status, 1);
		assert(
			/Error:.*No XML to parse!/.test(changesetCreateCmd.stderr.toString())
		);
	});
	it("should create an empty changeset", function() {
		this.slow(1000);
		this.timeout(2000);
		var tmpobj = tmp.dirSync();
		var packageVersionCmd = child.spawnSync(
			"node", [fdt, "package", "version", "38.0"], {
				cwd: tmpobj.name
			}
		);
		assert.deepEqual(packageVersionCmd.status, 0);
		var changesetCreateCmd = child.spawnSync(
			"node", [fdt, "changeset", "create", "empty"], {
				cwd: tmpobj.name
			}
		);
		assert.deepEqual(changesetCreateCmd.status, 0);
		assert(new RegExp("38.0").test(changesetCreateCmd.stdout.toString()));
	});
	it("should create an empty destructive changeset", function() {
		this.slow(1000);
		this.timeout(2000);
		var tmpobj = tmp.dirSync();
		var packageVersionCmd = child.spawnSync(
			"node", [fdt, "package", "version", "38.0"], {
				cwd: tmpobj.name
			}
		);
		assert.deepEqual(packageVersionCmd.status, 0);
		var changesetCreateCmd = child.spawnSync(
			"node", [fdt, "changeset", "create", "--destructive", "empty"], {
				cwd: tmpobj.name
			}
		);
		assert.deepEqual(changesetCreateCmd.status, 0);
		assert(new RegExp("38.0").test(changesetCreateCmd.stdout.toString()));
	});
});

var tests = [{
	gitCloneUrl: "https://github.com/amtrack/sfdx-playground.git",
	branch: "apex",
	description: "should handle added/modified/deleted Apex classes including -meta.xml changes",
	a: "apex-v1",
	b: "apex-v2",
	expected: path.join("config", "deployments", "apex-v1_apex-v2")
}];

(process.env.TEST_INTEGRATION === "true" ? describe : describe.skip)(
	"git diff | force-dev-tool changeset create",
	function() {
		var fdt = path.resolve(__dirname, "..", "..", "bin", "cli");
		tests.forEach(function(test) {
			it(test.description, function() {
				this.slow(5000);
				this.timeout(10000);
				var tmpobj = tmp.dirSync();
				var gitDir = tmpobj.name;
				var gitCloneCmd = child.spawnSync(
					"git", ["clone", test.gitCloneUrl, gitDir], {
						cwd: gitDir
					}
				);
				assert.deepEqual(gitCloneCmd.status, 0, gitCloneCmd.stderr);
				var gitCheckoutCmd = child.spawnSync("git", ["checkout", test.branch], {
					cwd: gitDir
				});
				assert.deepEqual(gitCheckoutCmd.status, 0, gitCheckoutCmd.stderr);
				var diffCmd = child.spawnSync("git", ["diff", "--no-renames", "apex-v1", "apex-v2"], {
					cwd: gitDir
				});
				var changesetCreateCmd = child.spawnSync(
					"node", [fdt, "changeset", "create", test.branch], {
						cwd: gitDir,
						input: diffCmd.stdout
					}
				);
				assert.deepEqual(
					changesetCreateCmd.status,
					0,
					changesetCreateCmd.stdout
				);
				var diffDirsCmd = child.spawnSync(
					"diff", [
						"-u",
						"-r",
						path.join(gitDir, test.expected),
						path.join(gitDir, "config", "deployments", test.branch)
					], {
						cwd: gitDir
					}
				);
				assert.deepEqual(diffDirsCmd.status, 0, diffDirsCmd.stderr);
			});
		});
	}
);
