const URL = "https://clintonfernandes.ca/COMP4537/Assignments/A01"

/**
 * Initializes the admin page.
 */
function initializeAdmin() {
    addHeaderComponent();

    getData().then(
        questions => {
            addQuestionCounterComponent(questions.length + 1);
            displayExistingQuestions(questions);
            displayQuestionForm();
            addButtons();
        }
    ) .catch( message => {
        console.log(`Something done gone happened: ${message}`);
    });
}

function initializeStudent() {
    addHeaderComponent(true);

    getData().then(
        questions => {
            if (questions.length === 0) {
                document.write("<p>No questions</p>");
            }
            addQuestionCounterComponent(questions.length + 1);
            displayExistingQuestions(questions);
            addBackButton();
            addCheckQuizButton(questions.length);
        }
    ) .catch( message => {
        console.log(`Something done gone happened: ${message}`);
    });

}

/**
 * Initializes the quiz from data source
 * @returns {Object} the quiz questions
 */
function getData() {
    return new Promise( (resolve, reject) => {
        const xhttp = new XMLHttpRequest();
        xhttp.open("GET", URL, true);
        xhttp.send();

        xhttp.onreadystatechange = () => {
            if (xhttp.readyState === 4 && xhttp.status === 200) {
                const questions = xhttp.response;
                resolve(JSON.parse(questions));
            }
        }

        // reject("ERROR in getData()()");
    })
}

/**
 * Adds the header to the Admin page
 *
 * @param {boolean} isStudent if the header page is for the student or admin
 *
 */
function addHeaderComponent(isStudent= false) {
    const headerText = document.createElement("p");
    let text = "Do the quiz!";

    if (onAdminPage()) {
        text = "Add a question below. Updates are immediately processed (on click or on leaving the field)."
    }

    headerText.innerHTML = text;
    document.body.appendChild(headerText);
}

/**
 * Adds component to track number of questions.
 *
 * @param {number} nextQuestionNumber of the next question
 */
function addQuestionCounterComponent(nextQuestionNumber) {
    const questionCount = document.createElement("p");
    questionCount.setAttribute("id", "number_of_questions");
    questionCount.innerText = nextQuestionNumber.toString();
    questionCount.setAttribute("hidden", "hidden");

    document.body.appendChild(questionCount);
}

/**
 * Renders an array of JSON MCQs to the DOM
 *
 * @param questions {Object} array of questions
 */
function displayExistingQuestions(questions) {
    for (let i = 0; i < questions.length; i++) {
        let question = questions[i];
        renderQuestion(question);
    }
}

/**
 * Renders a MCQ object into HTML.
 * @param questionObject {Object}
 */
function renderQuestion(questionObject) {
    let domItemsToAdd = [];
    let newDiv = createDiv(questionObject.questionId);

    domItemsToAdd.push(createQuestionDOMItem(questionObject.question, questionObject.questionId));
    domItemsToAdd.push(document.createElement("br"));

    const radioGroupName = "question_" + questionObject.questionId;
    const choicesArr = questionObject.choices;

    for (let i = 0; i < choicesArr.length; i++) {
        const choice = choicesArr[i];
        domItemsToAdd = domItemsToAdd.concat(convertJSONChoiceToHtml(questionObject.questionId, radioGroupName, choice));
    }

    domItemsToAdd.push(createSolutionElement(questionObject.solution_id, questionObject.questionId));

    for (let i = 0; i < domItemsToAdd.length; i++) {
        newDiv.appendChild(domItemsToAdd[i]);
    }

    document.body.appendChild(newDiv);
}

/**
 * Creates an element that holds a questions solution.
 *
 * @param solutionId {number} database id of the solution
 * @param questionNumber {number} database id of the question
 * @returns {HTMLLabelElement}
 */
function createSolutionElement(solutionId, questionNumber) {
    let solutionElement = document.createElement("label");
    solutionElement.innerText = solutionId;
    solutionElement.className = 'solution';

    const solIdAttr = formatSolutionId(questionNumber);
    solutionElement.setAttribute("id", solIdAttr);
    solutionElement.setAttribute("hidden", "hidden");

    return solutionElement;
}

/**
 * Renders a "form" for defining a multiple choice question
 *
 */
function displayQuestionForm() {
    let domItemsToAdd = [];

    const question = document.createElement("TEXTAREA");
    question.setAttribute("id", "new_question_text");
    question.setAttribute("class", "question_form");

    domItemsToAdd.push(question);
    domItemsToAdd.push(createLineBreak());

    domItemsToAdd = domItemsToAdd.concat(addNewQuestionElement("one"));
    domItemsToAdd = domItemsToAdd.concat(addNewQuestionElement("two"));
    domItemsToAdd = domItemsToAdd.concat(addNewQuestionElement("three"));
    domItemsToAdd = domItemsToAdd.concat(addNewQuestionElement("four"));

    for (let i = 0; i < domItemsToAdd.length; i++) {
        document.body.appendChild(domItemsToAdd[i]);
    }
}

/**
 * Adds a user-inputted question to the DOM.
 *
 * @param questionNumber {number} the number of the question to add (1-indexed)
 */
function convertNewQuestionToJson(questionNumber) {
    const question = document.getElementById("new_question_text").value;
    const choiceOne = document.getElementById("choice_one").value;
    const choiceTwo = document.getElementById("choice_two").value;
    const choiceThree = document.getElementById("choice_three").value;
    const choiceFour = document.getElementById("choice_four").value;

    let choicesArr = [];
    choicesArr.push({text: choiceOne, is_correct: false});
    choicesArr.push({text: choiceTwo, is_correct: false});

    if (choiceThree) {
        choicesArr.push({text: choiceThree, is_correct: false});
    }

    if (choiceFour) {
        choicesArr.push({text: choiceFour, is_correct: false});
    }

    let qElements = document.getElementsByName("new_question");
    for (let i = 0; i < qElements.length; i++) {
        if (qElements[i].checked) {
            choicesArr[i].is_correct = true;

        }
    }

    return {
        question: question,
        choices: choicesArr
    };
}

/**
 * R-renders the bottom of the admin page.
 */
function renderBottom() {
    deleteQuestionModule();
    displayQuestionForm();
    addButtons();
}

/**
 * Creates a radio button - text pair
 * @param choiceText {string} the choice for this element, in string format
 * @returns {[]}
 */
function addNewQuestionElement(choiceText) {
    let array = [];
    array.push(createRadioItem("radio_" + choiceText, "new_question"));
    array.push(createInputItem("choice_" + choiceText, "new_question"));
    array.push(createLineBreak());

    return array;
}

// Creation functions

/**
 * Creates a radio button to associate with a question.
 *
 * @param id the id for the radio button
 * @param radioGroup the name attribute for the radio buttons
 * @returns radio button
 */
function createRadioItem(id, radioGroup) {
    let radioItem = document.createElement("input");

    radioItem.setAttribute("type", "radio");
    radioItem.setAttribute("id", id);
    radioItem.setAttribute("name", radioGroup);
    if (radioGroup === 'new_question') {
        radioItem.setAttribute("class","question_form");
    }

    return radioItem;
}

/**
 * Creates a text input item.
 *
 * @param id the id for the input item
 * @param className {string} optional classname
 * @returns input text field
 */
function createInputItem(id, className = null) {
    let inputItem = document.createElement("input");

    inputItem.setAttribute("type", "text");
    inputItem.setAttribute("id", id);

    if (className) {
        inputItem.setAttribute("class", "question_form");
    }

    return inputItem;
}

function createDiv(questionNumber) {
    let newDiv = document.createElement("div");
    newDiv.setAttribute("class", `question_${questionNumber}`);

    return newDiv;
}

/**
 * Creates a textarea containing a question.
 *
 * @param text {string} The text of the question.
 * @param questionNumber {number} the number of the question. This will be used in the textarea's id attribute
 */
function createQuestionDOMItem(text, questionNumber) {
    let question = document.createElement("textarea");
    question.innerText = text;
    question.setAttribute("id", formatTextareaId(questionNumber));
    question.onblur = editQuestionHandler(questionNumber);

    if (! onAdminPage()) {
        question.disabled = true;
    }

    return question;
}

/**
 * Creates a textarea for choice text
 *
 * @param questionNumber {number} the db id of the question
 * @param choiceID {number} the db id of the choice
 * @param text {string} the text of the choice
 * @returns {HTMLTextAreaElement}
 */
function createQuestionChoiceText(questionNumber, choiceID, text) {
    const choiceText = document.createElement("textarea");
    choiceText.innerText = text;
    choiceText.setAttribute("id", formatChoiceTextId(questionNumber, choiceID));
    choiceText.onblur = editQuestionHandler(questionNumber);

    if (! onAdminPage()) {
        choiceText.disabled = true;
    }

    return choiceText;
}

/**
 * Adds line breaks to the DOM.
 * Elements have the "question_form" class for easy deletion.
 *
 * @returns {HTMLBRElement}
 */
function createLineBreak() {
    const br = document.createElement("br");
    br.setAttribute("class", "question_form");

    return br;
}

//

/**
 * Removes the question form and buttons from the DOM.
 */
function deleteQuestionModule() {
    let mcqElements = document.getElementsByClassName("question_form");

    while (mcqElements.length > 0) {
        mcqElements[0].parentNode.removeChild(mcqElements[0]);
    }

    let buttons = document.getElementsByClassName("buttons");
    while (buttons.length > 0) {
        buttons[0].parentNode.removeChild(buttons[0]);
    }
}

/**
 * Adds action buttons to bottom of admin page.
 */
function addButtons() {
    const addButton = document.createElement("button");
    addButton.innerHTML = "Add";
    addButton.onclick = addHandler;
    addButton.setAttribute("class", "buttons");
    document.body.appendChild(addButton);

    addBackButton();
}

/**
 * Adds a button that takes the user back to the home page.
 */
function addBackButton() {
    document.body.appendChild(document.createElement("br"));
    document.body.appendChild(document.createElement("br"));

    const goBack = document.createElement("button");
    goBack.innerHTML= "Home";
    goBack.setAttribute("class", "buttons");
    goBack.onclick = () => {
        window.location = "index.html"
    };

    document.body.appendChild(goBack);
}

function addCheckQuizButton(numberOfQuestions) {
    const checkQuiz = document.createElement("button");
    checkQuiz.innerHTML= "Check Answers";
    checkQuiz.setAttribute("class", "buttons");

    if (numberOfQuestions > 0) {
        checkQuiz.onclick = () => { evaluateQuiz(); };
    } else {
        checkQuiz.disabled = true;
    }

    document.body.appendChild(checkQuiz);
}

/**
 * Briefly changes the colour of all items in an question.
 *
 * @param questionId {Number} id (i.e. #) of the question
 */
function flashColour(questionId) {
    const divClass = `question_${questionId}`;

    let currentClass = document.getElementsByClassName(divClass);
    let oldClass = currentClass[0].getAttribute("class");

    for (let i = 0; i < currentClass.length; i++) {
        let newClass = currentClass[i].getAttribute("class");

        newClass = `${newClass} just_updated`;
        currentClass[i].setAttribute("class", newClass);
    }

    setTimeout( () => {
            for (let i = 0; i < currentClass.length; i++) {
                currentClass[i].setAttribute("class", oldClass);
            }
        },
        1500
    );
}

/**
 * Displays a temporary success message
 */
function displayPostOK() {
    let label = document.createElement("label");
    label.innerText = "Question added successfully";
    label.style.color = "green";

    document.body.appendChild(label);
    setTimeout( () => {
            document.body.removeChild(label);
        },
        2000
    );
}

// ID formatting
/**
 * Creates the id for the textarea of a question.
 *
 * @param questionNumber the question number
 * @returns {string}
 */
function formatTextareaId(questionNumber) {
    return "q_" + questionNumber + "_question";
}

/**
 * Creates the id for the radiobutton of a question.
 *
 * @param questionNumber the question number
 * @param choiceId {number} the database choice_id
 * @returns {string}
 */
function formatRadioButtonId(questionNumber, choiceId) {
    return "q_" + questionNumber + "_choice_" + choiceId;
}

/**
 * Creates the id for the text of a question's choice.
 *
 * @param questionId the question_id in the database
 * @param choiceId {number} the choice_id in the database
 * @returns {string}
 */
function formatChoiceTextId(questionId, choiceId) {
    return `q_${questionId}_choice_${choiceId}_value`;
}

/**
 * Creates the id for the solution id of a question.
 *
 * @param questionId {number} the DB id of the question
 * @returns {string}
 */
function formatSolutionId(questionId) {
    return `q_${questionId}_solution`;
}

// Converters

/**
 * Creates the DOM objects that represent a MCQ text.
 *
 * @param questionId {int} the DB id of the question
 * @param radioGroupName {string} the name of this radioGroup
 * @param choice {object} an object describing attributes of the choice
 */
function convertJSONChoiceToHtml(questionId, radioGroupName, choice) {
    const rbIdAttribute = formatRadioButtonId(questionId, choice.id);
    const button = createRadioItem(rbIdAttribute, radioGroupName);

    if (onAdminPage()) {
        button.onclick = clickChoiceHandler(questionId, choice.id);
    } else {
        //Anything to do??
    }


    if (onAdminPage() && choice.is_correct) {
        button.checked = true;
    }

    const textLabel = createQuestionChoiceText(questionId, choice.id, choice.text);

    let returnArray = [];

    returnArray.push(button);
    returnArray.push(textLabel);
    returnArray.push(document.createElement("br"));

    return returnArray;
}

/**
 * Converts a question in HTML into a JSON.
 *
 * @param questionId {Number} the question id as seen in the HTML id "q_<questionId>_question"
 * @returns {{Object}}
 */
function convertHTMLToJSON(questionId) {
    let question = {};

    const qHTMLId = formatTextareaId(questionId);
    const questionText = document.getElementById(qHTMLId).value;
    const solutionId = parseInt(document.getElementById(formatSolutionId(questionId)).innerText);

    let choices = [];
    const choiceObjects = document.getElementsByName(`question_${questionId}`);

    for (let i = 0; i < choiceObjects.length; i++) {
        let rbItem = choiceObjects[i];

        const offset = `q_choice_${questionId}_`.length;
        const choiceID = parseInt(rbItem.id.slice(offset));
        const choiceValueId = `q_${questionId}_choice_${choiceID}_value`;
        const choiceValue = document.getElementById(choiceValueId).value;

        choices.push({"id": choiceID, "text": choiceValue, "is_correct": false});
    }

    question.questionId = questionId;
    question.question = questionText;
    question.solution_id = solutionId;
    question.choices = choices;

    return question;
}

/**
 * Sets the is_correct field of the solution to a question
 *
 * @param questionObject {Object} the question object
 * @param idOfCorrectChoice {Number} db id of the correct choice
 * @returns {Object}
 */
function updateIsCorrect(questionObject, idOfCorrectChoice) { //Todo can just use the solution_id of the questionObject??
    for (let i = 0; i < questionObject.choices.length; i++) {
        if (questionObject.choices[i].id === idOfCorrectChoice) {
            questionObject.choices[i].is_correct = true;
            return questionObject;
        }
    }
}

// HANDLERS

/**
 * Performs event handing for the Add button.
 */
function addHandler() {
    console.log("Add button clicked");
    const questionNumber = parseInt(document.getElementById("number_of_questions").innerText);

    let newQuestion = convertNewQuestionToJson(questionNumber);

    console.log(`Sending ${newQuestion}`);

    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", URL, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.send(JSON.stringify(newQuestion));

    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4 && xhttp.status === 200) {
            console.log(`Received statements ${xhttp.response}`);

            displayPostOK();

            renderQuestion(newQuestion);

            document.body.appendChild(document.createElement("br"));

            renderBottom();
        }
    };
}

/**
 * Handles editing the question
 *
 * @param questionId {number} db id of the question
 * @returns {function(): void}
 */
function editQuestionHandler(questionId) {
    return () => {
        let question = convertHTMLToJSON(questionId);

        let choices = question.choices;
        for (let i = 0; i < choices.length; i++) {
            let choice = choices[i];

            if (choice.id === question.solution_id) {
                question.choices[i].is_correct = true;
            }
        }

        submitPutRequest(question);
    }
}

/**
 * Handles editing of a choice's text
 *
 * @param questionId {number} db id of the question
 */
function editChoiceHandler(questionId) {
    editQuestionHandler(questionId);
}

/**
 * Handles when a new solution is chosen.
 *
 * @param questionId {Number} the number of the question (id in DB)
 * @param idOfCorrectChoice {Number} db id of the correct choice
 * @returns {function(): void}
 */
function clickChoiceHandler(questionId, idOfCorrectChoice) {
    return () => {
        let question = convertHTMLToJSON(questionId);
        question.solution_id = parseInt(document.getElementById(`q_${questionId}_solution`).innerText);

        const solutionIdHtmlId = formatSolutionId(questionId);
        const rbItemHtmlId = formatRadioButtonId(questionId, idOfCorrectChoice);

        document.getElementById(solutionIdHtmlId).innerText = idOfCorrectChoice;
        document.getElementById(rbItemHtmlId).checked = true;

        question = updateIsCorrect(question, idOfCorrectChoice);
        console.log(`Sending PUT request: ${JSON.stringify(question)}`);

        submitPutRequest(question); // Probably some async bullshit
    }
}

/**
 * Submits a PUT request
 *
 * @param newQuestion
 */
function submitPutRequest(newQuestion) {
    const xhttp = new XMLHttpRequest();
    xhttp.open("PUT", URL, true);
    xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhttp.send(JSON.stringify(newQuestion));

    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4 && xhttp.status === 200) {
            console.log(`Received statements ${xhttp.response}`);


            flashColour(newQuestion.questionId);
        }
    };
}

/**
 * Determines if the current page is the admin page (or not)
 *
 * @returns {boolean}
 */
function onAdminPage() {
    return window.location.href.search("admin") !== -1;
}

/**
 * Evaluates a quiz's submission
 */
function evaluateQuiz() {
    const solutions = document.getElementsByClassName('solution');

    let questionsRight = 0;
    const quizSize = solutions.length;

    for (let i = 0; i < solutions.length; i++) {
        let questionHtmlId = solutions[i].getAttribute("id");
        let questionId = questionHtmlId.split('_')[1];
        let correctChoiceId = parseInt(solutions[i].innerText);

        let questionSolution = formatRadioButtonId(questionId, correctChoiceId);
        console.log(`Checking ${questionSolution}`);

        if (document.getElementById(questionSolution).checked === true) {
            questionsRight += 1;
        }
    }

    window.alert(`You got ${questionsRight}/${quizSize}!`);
}