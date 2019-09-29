// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as extension from '../src/extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Sample Extension Tests", () => {

  // Defines a Mocha unit test
  test("Test 1", () => {
    assert.equal(0, [1, 2, 3].indexOf(1));
    assert.equal(1, [1, 2, 3].indexOf(2));
  });
});