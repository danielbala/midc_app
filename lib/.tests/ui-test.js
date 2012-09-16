if (typeof require == "function" && typeof module == "object") {
    buster = require("buster");
}

var assert = buster.assert;
buster.testCase("MIDC APP ", {
    setUp: function () {
        this.date = new Date(2009, 11, 5);
    },

    "Init": {
        
        "should be properly setup": function () {
            assert.equals(1, 1);
        },
		"should have jQuery": function () {
            assert.equals(typeof $, "function");
        }

    },

    "//%j should return the day of the year": function () {
        var date = new Date(2011, 0, 1);
        assert.equals(date.strftime("%j"), 1);
    }
});