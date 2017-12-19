/*
	Autmoated testing via Selenium

	NOTE: Tests depend on CPTR999 > data0.json
		data0.json contents:
			{    
			    "0": {
			    	"questionType": "mchoice",
			    	"language": "c++",
			        "problem": "Given the following declarations, evaluate the following Boolean expressions:",
			        "skeleton": "int x = 3, y = 5, z = 7;",
			        "input": [ ["x >= y", ["True", "False"]],  ["x >= 0 && z < 10", ["True", "False"]], ["x >= 0 || z < 10", ["True", "False"]] ],
			        "output": ["1", "0", "0"],
			        "points": ["5", "5", "5"],
			        "difficulty": "0"
			    },
			    "1": {
			    	"questionType": "code",
			    	"language": "c++",
			        "problem": "Write a C++ function called print that accepts a string and prints it out.",
			        "skeleton": ["#include <iostream>\nusing namespace std;\n\n%READ_IN%\nint main() {\n   string x = \"printed\";\n   print(x);\n}\n", "%READ_IN%", "//Write your code here\nvoid print(string x){\n   cout << x;\n}"],
			        "input": [""],
			        "output": ["printed"],
			        "points": ["15"],
			        "difficulty": "0"
			    },
			    "2": {
			    	"questionType": "code",
			    	"language": "python",
			        "problem": "In python, define and call a simple function that accepts and prints the word 'Student'.",
			        "skeleton": "def greet(name):\n   print(name)\ngreet('Student')",
			        "input": [""],
			        "output": ["Student"],
			        "points": ["10"],
			        "difficulty": "0"
			    },
			    "prop": {
			        "closeDate": "7-3-2018",
			        "closeTime": "13:30",
			        "allowMultiple": "false",
			        "time": "15",
			        "warn": ["10", "5"],
			        "whitelist": ["0421291", "0421292"],
			        "access": "true"
			    }
			}
*/

const {Builder, By, Key, until} = require('selenium-webdriver');
 
//Set up vars
const endPoint = "http://localhost:8080/saucs/";
const browser = "safari";

var driver = new Builder().forBrowser(browser).build();
driver.manage().window().maximize();


// Exam load automation test
//Datafile: Course: CPTR999, Exam: 0 (data0.json)
function loadTest() {
	driver.get(endPoint);
	driver.findElement(By.id('userID')).sendKeys('0421291');
	driver.findElement(By.id('courseID')).sendKeys('CPTR999');
	driver.findElement(By.id('quizID')).sendKeys('0', Key.RETURN);
	 
	//Wait for load
	driver.wait(until.elementLocated(By.id('container')), 1000).then(null, function(err){
		if(err.name === "TimeoutError")
			console.log("loadTest: Fail");
		else
	        console.log("loadTest: Pass");
	})
	driver.quit();
}


// Exam whitelist automation test
//Datafile: Course: CPTR999, Exam: 0 (data0.json)
function whitelistTest() {
	driver.get(endPoint);
	driver.findElement(By.id('userID')).sendKeys('0000000');
	driver.findElement(By.id('courseID')).sendKeys('CPTR999');
	driver.findElement(By.id('quizID')).sendKeys('0', Key.RETURN);

	//Wait for load
	driver.sleep(1000);

	driver.findElement(By.id('container')).then(null, function (err) {
	    if (err.name === "NoSuchElementError")
	        console.log("whitelistTest: Pass");
	    else
	    	console.log("whitelistTest: Fail");
	});
	driver.quit();
}
 
 
// Exam compile automation test
//Datafile: Course: CPTR999, Exam: 0 (data0.json)
function pythonCompileTest(){
	driver.get(endPoint);
	driver.findElement(By.id('userID')).sendKeys('0421291');
	driver.findElement(By.id('courseID')).sendKeys('CPTR999');
	driver.findElement(By.id('quizID')).sendKeys('0', Key.RETURN);
	 
	//Wait for load then navigate
	driver.sleep(1000);
	driver.findElement(By.id('startExamBtn')).click();
	driver.findElement(By.id('navShortcutElement2')).click();

	//Wait for animation then compile
	driver.sleep(2000);
	driver.findElement(By.id('compile2Btn')).click();

	//Wait for animation then continue compile
	driver.sleep(500)
	driver.findElement(By.id('sectionWarnBtn')).click();

	//Wait for animatino and compile result
	driver.sleep(2000);
	driver.findElement(By.id('codeResults2')).getAttribute('value').then(el => (el.trim() === "Student") ? console.log("pythonCompileTest: Pass") : console.log("pythonCompileTest: Fail"));
	driver.quit();
}
 


//Fns, run each separately
//loadTest();
//whitelistTest();
pythonCompileTest();
