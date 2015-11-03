var Parse = require('Parse').Parse;
var XLSX = require('xlsx');
var config = require('./config');

Parse.initialize(config.appId, config.javascriptKey);

var workbook = XLSX.readFile('files/GSTContent.xlsx');

/* Initialize classes */

var Category = Parse.Object.extend('Category');
var Question = Parse.Object.extend('Question');
var Alternative = Parse.Object.extend('Alternative');

var categorySheet = workbook.Sheets['Category'];
var categoryIds = Array();
console.log('Parsing categories');
for (z in categorySheet) {
	if(z != 'A1' && z.charAt(0) == 'A') {
		categoryIds.push(categorySheet[z].v);
	}	
}

/* Get categories to match them with the questions */
var categoryList = Array();

var categoryQuery = new Parse.Query(Category);
categoryQuery.containedIn("objectId", categoryIds);

console.log('\nRetrieving categories');
categoryQuery.find({
  success: function(results) {
    for (var i = 0; i < results.length; i++) {
      categoryList.push(results[i]);
    }
    console.log('\nCategories retrieved');
    matchQuestions(categoryList);
  },
  error: function(error) {
    alert("Error: " + error.code + " " + error.message);
  }
});

var matchQuestions = function(categories) {
	var questionList = Array();
	var questionSheet = workbook.Sheets['Question'];
	console.log('\nMatching questions and categories');
	for (q in questionSheet) {
		if(q != 'A1' && q.charAt(0) == 'A') {
			var question = new Question();
			question.set('title', String(questionSheet[q].v));
			for(var i = 0; i < categories.length; i++) {
				if(q.length <= 2) {
					if(categories[i].id == questionSheet['B'+q.charAt(1)].v) {
						question.set("category", categories[i]);
					}
				} else {
					if(categories[i].id == questionSheet['B'+q.substring(1)].v) {
						question.set("category", categories[i]);
					}
				}
			}
			questionList.push(question);
		}
	}
	console.log('\nQuestions matched');
	saveQuestions(questionList);
};

var saveQuestions = function(questions) {
	var singleQuestion = questions.shift();
	console.log('\nSaving question: ' + singleQuestion.get('title'));
	singleQuestion.save(null, {
		success: function(singleQuestion) {
			console.log('\nNew object created with objectId: ' + singleQuestion.id);
			if(questions.length > 0) {
				saveQuestions(questions);
			} else {
				matchAlternatives();
			}
		},
		error: function(singleQuestion, error) {
			console.log('\nFailed to create new object, with error code: ' + error.message);
		}
	});
};

var matchAlternatives = function() {
	console.log('\nRetrieving questions to match alternatives');
	var alternativeList = Array();
	var questions = new Parse.Query(Question);
	questions.find({
	  success: function(results) {
	    console.log('\nMatching alternatives');
	    var alternativeSheet = workbook.Sheets['Alternative'];
	    var questionSheet = workbook.Sheets['Question'];
	    for(a in alternativeSheet) {
	    	if(a != 'A1' && a.charAt(0) == 'A') {
	    		var alternative = new Alternative();
	    		alternative.set('title', String(alternativeSheet[a].v));
	    		if(a.length <= 2) {
	    			alternative.set('rightAnswer', Boolean(alternativeSheet['B'+a.charAt(1)].v));	
	    		} else {
	    			alternative.set('rightAnswer', Boolean(alternativeSheet['B'+a.substring(1)].v));
	    		}
	    		
	    		for(var i = 0; i < results.length; i++) {
	    			if(a.length <= 2) {
	    				if(results[i].get('title') == questionSheet['A'+alternativeSheet['C'+a.charAt(1)].v].v) {
		    				console.log('\nMatched question!');
		    				alternative.set('question', results[i]);
		    			}
	    			} else {
	    				if(results[i].get('title') == questionSheet['A'+alternativeSheet['C'+a.substring(1)].v].v) {
		    				console.log('\nMatched question!');
		    				alternative.set('question', results[i]);
		    			} 
	    			}
	    			
	    		}
	    		alternativeList.push(alternative);
	    	}
	    }
	    saveAlternatives(alternativeList);
	  },
	  error: function(error) {
	    alert("Error: " + error.code + " " + error.message);
	  }
	});
};

var saveAlternatives = function(alternatives) {
	var singleAlternative = alternatives.shift();
	console.log('\nSaving alternative: ' + singleAlternative.get('title'));
	singleAlternative.save(null, {
		success: function(singleAlternative) {
			console.log('\nNew object created with objectId: ' + singleAlternative.id);
			if(alternatives.length > 0) {
				saveAlternatives(alternatives);
			} else {
				console.log('\nAlternatives saved! All done!')
			}
		},
		error: function(singleAlternative, error) {
			console.log('\nFailed to create new object, with error code: ' + error.message);
		}
	});
};
