"use strict";

/* 
This "Simple" JS Calculator App was built with design inspiration taken from the native Samsung Calculator app.

The arithmetic operands are stored in an array and can either be "parenthesized" or not.. If "parenthesized", these operands are enclosed within parentheses and stored in a discrete string element, otherwise they are stored as discrete elements of the array.

The SimlCalc if you will :>
*/

//Select DOM Elements to be manipulated
const buttonContainer = document.querySelector(".calc-buttons");
const screenElem = document.querySelector(".calc-screen > input");
const backspaceButton = document.getElementById("backspace");
const cancelButton = document.getElementById("cancel");
const equalButton = document.getElementById("equals");
const answerBox = document.querySelector(".calc-screen > p");
const errorBox = document.getElementById("error-box");

//Set state variables
let screenText = []; //This will store the current operations
let curLen = screenText.length;
let previousVal = screenText[curLen - 1];
let parenthesized = false;

//Fn to Programmatically scroll horizontally
const isOverflown = function (elem) {
  if (elem.scrollWidth < elem.clientWidth) return;
  elem.scrollLeft = elem.scrollWidth - elem.clientWidth;
};

//Inserts operands depending on parentheses prescence
const isParenthesized = function (parentheses, literal, currVals) {
  if (parentheses) updateValues(currVals, literal, "incr");
  else updateValues(currVals, literal);
};

//These Regular Expressions are used in this program
const regexForZero = /([1-9.]+0*)$/;
const regexMatchNegNum = /\(-[0-9.]+$|^-[0-9.]+$/;
const regexForEndNum = /[0-9.]+$/;
const regexForOperators = /[/*\-+]/;
const regexForDeciNum = /([0-9]+\.{1}[0-9]*)+$/;
const regexLBrack = /[^(]/g;
const regexRBrack = /[^)]/g;

// These are the functions used for the program

const joinVals = (arr) => arr.join("");

// The INTL API formats numbers based on given options/locale
const numNoComma = new Intl.NumberFormat("en-US", {
  useGrouping: false, //value of "always" by default
  maximumFractionDigits: 5,
});

const numWithComma = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 5,
});

//This function expression performs simple C*UD operation on the ops arr
const updateValues = function (currVals, val, option = "push") {
  const lastValue = currVals[curLen - 1];

  if (option === "push") {
    if (typeof val === "object") {
      currVals.push(...val);
    } else currVals.push(val);
  } else if (option === "incr") {
    currVals[curLen - 1] += typeof val === "object" ? val.join("") : val;
  } else if (option === "replace") {
    currVals[curLen - 1] = val;
  } else if (option === "unshift") {
    currVals[curLen - 1] = `${val}${lastValue}`;
  } else if (option === "replaceLastVal") {
    currVals[curLen - 1] = `${lastValue.slice(0, -1)}${val}`;
  } else console.log("Error");
};

//This Fn mimics the backspace key
const backspaceFn = function () {
  if (screenText.length === 0) return;
  screenElem.classList.remove("moved");

  const lastVal = screenText.pop();
  if (lastVal.length > 1) {
    screenText.push(lastVal.slice(0, -1));
  }

  screenElem.value = joinVals(screenText);
  returnAnswer();
};

//This clears the current screen
const cancelFn = function () {
  screenText = [];
  [screenElem.value, answerBox.textContent] = ["", ""];
};

//Return answer and "move it up" to become input
const equalFn = function () {
  const calcVal = calc(screenText.join(""), true);
  if (answerBox.textContent === "") return;

  answerBox.classList.add("moved");

  setTimeout(() => {
    screenText = [numNoComma.format(calcVal)];
    screenElem.value = joinVals(screenText);

    screenElem.classList.add("moved");
    answerBox.textContent = "";
    answerBox.classList.remove("moved");
  }, 200);
};

const showError = function (str) {
  if (errorBox.textContent !== "") return;
  if (str.length > 30) {
    str = `${str.slice(0, str.lastIndexOf(" "))}...`;
  }
  errorBox.textContent = str;
  errorBox.classList.add("visible");

  // Remove the pop-up after 1.2s
  const errTim = setTimeout(() => {
    errorBox.classList.remove("visible");
    clearTimeout(errTim);

    //Reset the text after 1.8s to account for CSS transition
    const errTxt = setTimeout(() => {
      errorBox.textContent = "";
      clearTimeout(errTxt);
    }, 600);
  }, 1200);
};

//Handle all numeric inputs from user
const handleNumbers = function (currVals, elemVal) {
  const lastVal = previousVal && previousVal[previousVal.length - 1];
  switch (true) {
    case previousVal === undefined:
      updateValues(currVals, elemVal);
      break;
    // Do not allow two consecutive zeroes to a start an operand
    case lastVal === "0":
      if (previousVal.match(regexForZero) === null) {
        updateValues(currVals, elemVal, "replaceLastVal");
      } else updateValues(currVals, elemVal, "incr");
      break;
    case lastVal === "%" || lastVal === ")":
      isParenthesized(parenthesized, ["*", elemVal], currVals);
      break;
    //Increment with elemVal rather than pushing to the array
    case previousVal.replace(regexForEndNum, "") === "":
      updateValues(currVals, elemVal, "incr");
      break;
    default:
      isParenthesized(parenthesized, elemVal, currVals);
      break;
  }
  return currVals;
};

//Handle all supported arithmetic operators from user
const handleOperators = function (currVals, elemVal) {
  const lastVal = previousVal && previousVal[previousVal.length - 1];

  if (previousVal === undefined || elemVal === lastVal) return currVals;

  switch (true) {
    case lastVal === "(":
      break;
    case lastVal === elemVal:
      break;
    case lastVal === "%":
      if (elemVal !== "%") {
        isParenthesized(parenthesized, elemVal, currVals);
      }
      break;
    case lastVal.match(regexForOperators) !== null:
      if (elemVal !== "%") {
        updateValues(currVals, elemVal, "replaceLastVal");
      }
      break;
    case elemVal === "%":
      if (lastVal !== "%") updateValues(currVals, elemVal, "incr");
      break;
    default:
      isParenthesized(parenthesized, elemVal, currVals);
      break;
  }

  return currVals;
};

//Handles the return value when a decimal point is added
const handleDots = function (currVals, elemVal) {
  if (previousVal === undefined) {
    updateValues(currVals, `0${elemVal}`);
    return currVals;
  }
  const lastVal = previousVal[previousVal.length - 1];

  switch (true) {
    case previousVal.match(regexForDeciNum) !== null:
      break;
    case lastVal.replace(/[0-9]/, "") === "":
      updateValues(currVals, elemVal, "incr");
      break;
    case lastVal === ")":
      isParenthesized(parenthesized, ["*", `0${elemVal}`], currVals);
      break;
    default:
      isParenthesized(parenthesized, `0${elemVal}`, currVals);
      break;
  }
  return currVals;
};

const handleBrackets = function (currVals) {
  const lastVal = previousVal && previousVal[previousVal.length - 1];

  //Add a closing bracket under certain conditions
  if (
    lastVal !== "(" &&
    parenthesized &&
    lastVal.replace(/[0-9.%\)]/, "") === ""
  ) {
    updateValues(currVals, ")", "incr");
    return currVals;
  }

  switch (true) {
    case previousVal === undefined:
      updateValues(currVals, "(");
      break;
    case lastVal === "(":
      updateValues(currVals, "(", "incr");
      break;
    case previousVal.replace(/^[0-9.%]+/g, "") === "":
      isParenthesized(parenthesized, ["*", "("], currVals);
      break;
    case lastVal === ")":
      updateValues(currVals, ["*", "("]);
      break;

    default:
      isParenthesized(parenthesized, "(", currVals);
      break;
  }
  return currVals;
};

//Handles negation of given value
const handleDash = function (currVals) {
  const lastVal = previousVal && previousVal[previousVal.length - 1];

  switch (true) {
    case lastVal === undefined:
      updateValues(currVals, "(-");
      break;

    case previousVal.match(regexForEndNum) !== null:
      const matcher = previousVal.match(regexForEndNum)[0];
      const replacer = previousVal.replace(regexForEndNum, `(-${matcher}`);
      updateValues(currVals, replacer, "replace");
      break;

    case previousVal.match(regexMatchNegNum) !== null:
      let matched = previousVal.match(regexMatchNegNum)[0];
      matched = matched.replace(/\(?-/, "");
      const replacee = previousVal.replace(regexMatchNegNum, `${matched}`);
      // console.log(matched);
      updateValues(currVals, replacee, "replace");
      break;

    case lastVal === ")" || lastVal === "%":
      isParenthesized(parenthesized, ["*", "(-"], currVals);
      break;
    default:
      isParenthesized(parenthesized, "(-", currVals);
      break;
  }

  return currVals;
};

//This function allows the user to use both the onscreen buttons and keys on a keypad/keyboard.
const collectLiterals = function (e, key, switchVal) {
  //Check if fn was called by click event or not
  const target = e && e.target;

  // Use Event Delegaion to handle buttons of particular type
  if (target !== undefined && !target.classList.contains("calc-button")) return;

  // Max length for input
  if (screenText.join("").length >= 20) {
    showError("Maximum limit reached");
    return;
  }

  screenElem.classList.remove("moved");

  curLen = screenText.length;
  previousVal = screenText[curLen - 1];

  //This boolean value is used to check if the current operation is in parentheses.
  parenthesized =
    previousVal &&
    previousVal[0] === "(" &&
    previousVal.replace(regexLBrack, "").length !==
      previousVal.replace(regexRBrack, "").length;

  //Switch statement to call corresponding function for a given operand

  //The or operator facilitates the use of button or keypad interaction
  switch (switchVal || target.classList[1]) {
    case "number":
      screenElem.value = joinVals(
        handleNumbers(screenText, key || target.textContent)
      );
      break;

    case "sign":
      screenElem.value = joinVals(
        handleOperators(screenText, key || target.textContent)
      );
      break;

    case "dot":
      screenElem.value = joinVals(
        handleDots(screenText, key || target.textContent)
      );
      break;

    case "brackets":
      screenElem.value = joinVals(
        handleBrackets(screenText, target.textContent)
      );
      break;

    case "dash":
      screenElem.value = joinVals(handleDash(screenText, target.textContent));
      break;
    case "equals":
      equalFn();
    default:
      break;
  }

  // auto-scroll input and answerbox if overflowing
  isOverflown(screenElem);
  isOverflown(answerBox);

  // Return answer on the fly
  returnAnswer();
};

//Maps key press to corresponding switch-case statement in collectLiteral Fn
const handleKeyPressFn = function (e) {
  if (document.activeElement !== screenElem) return;

  const keyPressed = e.key;
  screenElem.classList.remove("moved");

  switch (true) {
    case keyPressed.replace(/[0-9]/g, "") === "":
      collectLiterals(undefined, keyPressed, "number");
      break;

    case keyPressed.replace(/[\%\/\*\-\+]/g, "") === "":
      collectLiterals(undefined, keyPressed, "sign");
      break;

    case keyPressed === ".":
      collectLiterals(undefined, keyPressed, "dot");
      break;

    case keyPressed === "Backspace":
      backspaceFn();
      break;

    case keyPressed === "Enter" || keyPressed === "=":
      collectLiterals(undefined, keyPressed, "equals");
      break;
    default:
      break;
  }
};

//This function returns the calculated value
function calc(expression, final = false) {
  if (expression === "") return "";
  let expressionFilter = expression;

  // This block replaces instances of percentage values with their numeric equivalents using regex
  if (expressionFilter.includes("%")) {
    const regexPercent = /([0-9.]+%)/g;
    const matchesPercent = expression.matchAll(regexPercent);

    for (const [el, ...ot] of matchesPercent) {
      let numericPart = Number.parseFloat(el) / 100;
      expressionFilter = expressionFilter.replace(`${el}`, `${numericPart}`);
    }
  }

  //Replaces any percentage symbol left
  // expressionFilter = expressionFilter.replaceAll("%", "/100");

  expressionFilter = expressionFilter.replace(/%/g, "/100");
  console.log(expressionFilter);

  //Use a try-catch block to catch any unwanted errrors
  try {
    //The function constructor acts like an eval but is safer.
    let value = Function(`
    "use strict";

    return (${expressionFilter})

    `)();
    if (value === Infinity || value === -Infinity) {
      if (final) showError("Can't divide by zero.");
      return "";
    }
    return value;
  } catch (error) {
    // console.log(error.name);
    if (final && expressionFilter !== "") showError(error.name);
    return "";
  }
}

function returnAnswer() {
  const returnAns = calc(screenText.join(""));
  answerBox.textContent =
    returnAns !== "" ? numWithComma.format(returnAns) : "";
}

screenElem.focus();
//Event Listeners used in this program
buttonContainer.addEventListener("click", collectLiterals);
document.addEventListener("keydown", handleKeyPressFn);
backspaceButton.addEventListener("click", backspaceFn);
cancelButton.addEventListener("click", cancelFn);
