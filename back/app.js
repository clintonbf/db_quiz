"use strict";

const http  = require('http');
const mysql = require('mysql');
const fs    = require('fs');
const cred  = require('./modules/credentials')

const dbAdmin   = cred.getDBAdmin();
const dbUser    = cred.getDBUser();

const GET = "GET";
const POST = "POST";
const PUT = "PUT";
const OPTIONS = "OPTIONS";

const listener = http.createServer( (req, res) => {
   if (req.method === GET) {
        const query =   `SELECT q.id AS q_id, q.text AS question, c.id AS c_id, c.text AS answer, q.solution_id, c.is_correct
                        FROM question q, choices c
                        WHERE c.question_id = q.id
                        ORDER BY q.id`;

        let test = [];

        dbAdmin.connect ( err => {
            if (err) {
                console.log("Error on connect");
            } //todo Gotta be something better than this

            console.log("Admin has received GET request");

            dbAdmin.query(query, (err, result) => {
                if (err) {
                    console.log(`ERROR: ${err}`);
                    res.end();
                    throw err;
                }

                if (result.length !== 0) {
                    console.log(`Result ${JSON.stringify(result)}`);

                    let questionId = null;
                    let questionObject = {};
                    let choices = [];

                    // First result
                    let record = result[0];
                    questionId = record.q_id;
                    questionObject.questionId = questionId;
                    questionObject.question = record.question;
                    questionObject.solution_id = record.solution_id
                    choices.push({
                        id:             record.c_id,
                        text:           record.answer,
                        is_correct:     record.is_correct
                    });

                    for (let i = 1; i < result.length; i++) {
                        record = result[i];

                        if (record.q_id === questionId) {
                            questionObject.question = record.question;
                            questionObject.solution_id = record.solution_id

                            choices.push({
                                id:             record.c_id,
                                text:           record.answer,
                                is_correct:     record.is_correct
                            });
                        } else {
                            if (questionObject) {
                                questionObject.choices = choices;
                                choices = [];

                                test.push(questionObject);
                                questionObject = {};
                            }

                            questionId = record.q_id;
                            questionObject.questionId = questionId;
                            questionObject.question = record.question;
                            questionObject.solution_id = record.solution_id;

                            choices.push({
                                id:             record.c_id,
                                text:           record.answer,
                                is_correct:     record.is_correct
                            });
                        }
                    }

                    // Last object
                    //What if there is only ONE question??
                    questionObject.choices = choices;
                    test.push(questionObject);
                }

                res.writeHead(200, { 'Content-type': 'text/html', 'Access-Control-Allow-Origin': "*" } );
                res.write (JSON.stringify(test));
                res.end();
            });
        });
    }

   if (req.method === POST) {
       let sourceData = '';

       req.on('data', chunk => {
           sourceData += chunk;
       })

       req.on('data', chunk => {
           let data = JSON.parse(sourceData);

           const questionInsert =
               `INSERT INTO question
            (text)
            VALUES
            ("${data.question}");
            `;

           const maxQId = "SELECT MAX(id) AS mQId FROM question";

           // dbAdmin.connect(err => {
           //     if (err) throw err;

               dbAdmin.query(questionInsert, (qErr, result) => {
                   if (qErr) throw qErr;

                   dbAdmin.query(maxQId, (mErr, result) => {
                       if (mErr) throw mErr;

                       let nextQuestionId = result[0].mQId;

                       let choiceString;
                       let choices = data.choices;
                       choiceString = `("${choices[0].text}", ${nextQuestionId}, ${choices[0].is_correct})`;

                       for (let i = 1; i < data.choices.length - 1; i++) {
                           choiceString = choiceString + `,\n ("${choices[i].text}", ${nextQuestionId}, ${choices[i].is_correct})`
                       }

                       choiceString = choiceString + `,\n ("${choices[choices.length - 1].text}", ${nextQuestionId}, ${choices[choices.length - 1].is_correct})`

                       const choicesInsert =
                           `INSERT INTO choices
                       (text, question_id, is_correct)
                       VALUES
                       ${choiceString};
                        `
                       dbAdmin.query(choicesInsert, (cErr, result) => {
                           if (cErr) throw cErr;

                           const updateQuestion =
                               `UPDATE question
                               SET solution_id =
                                (SELECT MAX(id) as sol_id
                                FROM choices
                                WHERE is_correct = TRUE)
                               WHERE id = (SELECT MAX(id)
                                FROM question
                                WHERE solution_id IS NULL)
                                `;

                           dbAdmin.query(updateQuestion, (uErr, result) => {
                               if (uErr) throw uErr;

                               res.end(updateQuestion);
                           });
                       });
                   })
               });
           });
       // });
   }

   if (req.method === PUT || req.method === OPTIONS) {
        //Update every aspect of the question
       console.log("Admin has received PUT request");

       let sourceData = '';

       req.on('data', chunk => {
           sourceData += chunk;
       });

       req.on('end', chunk => {
           const data = JSON.parse(sourceData);

           const choices = data.choices;
           let newSolutionId;
           let index = 0;

           while (!newSolutionId) {
               if (choices[index].is_correct) {
                   newSolutionId = choices[index].id;
               }

               index += 1;
           }

           const updateQuestion =
               `UPDATE question
               SET text = "${data.question}",
               solution_id = ${newSolutionId}
               WHERE id = ${data.questionId};`;

           // execute question update statement

           // This is an INSERT but the terminal statement clause "should" make it update instead. I hope.
           let updateChoices =
               `INSERT INTO choices (id, text, is_correct, question_id)
               VALUES
               `;

           let appendStatement = `(${choices[0].id}, "${choices[0].text}", ${choices[0].is_correct}, ${data.questionId})`;

           updateChoices = updateChoices + appendStatement;

           for (let i = 1; i < data.choices.length - 1; i++) {
               let choiceObj = choices[i];

               appendStatement = `,\n(${choices[i].id}, "${choices[i].text}", ${choices[i].is_correct}, ${data.questionId})`;
               updateChoices = updateChoices + appendStatement
           }

           const lastChoice = choices[choices.length - 1];

           appendStatement = `,\n(${lastChoice.id}, "${lastChoice.text}", ${lastChoice.is_correct}, ${data.questionId})\n`;
           updateChoices = updateChoices + appendStatement;

           updateChoices = updateChoices +
               `ON DUPLICATE KEY UPDATE
               is_correct = VALUES(is_correct),
               text = VALUES(text);`;

           // execute choices update statement

           update(dbAdmin, updateQuestion)
               .then( update(dbAdmin, updateChoices) )
               .catch( () => { console.log("Error executing PUT method"); });

           res.writeHead(200, { 'Content-type': 'text/html', 'Access-Control-Allow-Origin': "*", 'Access-Control-Allow-Methods': "*" } );
           res.write(`Question update: ${updateQuestion}`);
           res.write(`Choices update: ${updateChoices}`);
           res.end("PUT OK");
       });
   }
});

listener.listen( () => {
    console.log(`Server running on port ${listener.address().port}`);
});

function update(connection, query) {
    return new Promise( (resolve, reject) => {
        connection.query(query);

        resolve = () => { console.log("PUT method executed OK"); }

        reject = () => { console.log("Error updating question in PUT method"); }
    });
}