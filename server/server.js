require('./config/config');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const firebase = require('firebase-admin');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


var serviceAccount = require('../serviceAccountKey.json');

//Configuracion Firebase
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://getmystyle-89b9e.firebaseio.com'
});

var dataBase = firebase.database();

//Referencias a las tablas
var stylesRef = firebase.database().ref("/Styles/");
var userTableRef = dataBase.ref("/Users");
var surveyTableRef = dataBase.ref("/Survey");

// configure app to handle CORS requests
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POSTS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
    next();
});

// Get Users
app.get('/Users', function(req, res) {
    userTableRef.once("value", function(snapshot, prevChildKey) {
        res.status(200).json({
            ok: true,
            message: snapshot.val()
        });
    });
})

//Get Styles
app.get('/Styles', function(req, res) {
    stylesRef.once("value", function(snapshot, prevChildKey) {
        res.status(200).json({
            ok: true,
            message: snapshot.val()
        });
    });
});


// Create Users
app.post('/Users', function(req, res) {
    let body = req.body;
    // Se inserta el nuevo usuario
    var rootRef = dataBase.ref().child('Users').push();
    rootRef.set(
        body,
        function(err) {
            if (err) {
                res.status(400).json({
                    ok: true,
                    message: err
                });
            } else {
                res.status(200).json({
                    ok: true,
                    message: {
                        key: rootRef.key,
                        message: "Success: User created."
                    }
                });
            }
        }
    );
});

//Get user by email 
app.get('/Users/:email', function(req, res) {
    let paramEmail = req.params.email;
    var obtain = {};
    obtenerUsr(paramEmail).then(result => {
        obtain = result;
        res.status(200).json(obtain);
    }, (err) => {
        obtain = err;
        res.status(200).json(obtain);
    });
});

function obtenerUsr(paramEmail) {
    return new Promise((resolve, reject) => {
        dataBase.ref('Users').orderByChild('email').equalTo(paramEmail).on("value", function(snapshot) {
            if (snapshot.exists()) {
                snapshot.forEach(function(data) {
                    resolve({ ok: true, key: data.key, valor: data.val() });
                });
            } else {
                reject({ ok: false, menssage: "Failed:  No user found." });
            }
        });
    });
}



//Get Survey
app.get('/Survey/:idUser', function(req, res) {
    let paramIdUser = req.params.idUser;
    var obtain = {};
    obtenerSurvey(paramIdUser).then(result => {
        obtain = result;
        res.status(200).json(obtain);
    }, (err) => {
        obtain = err;
        res.status(200).json(obtain);
    });
});


//ObtenerSurvey
function obtenerSurvey(paramUserKEY) {
    return new Promise((resolve, reject) => {
        dataBase.ref('Survey').child(paramUserKEY).orderByChild('creationDate').limitToLast(1).on("value", function(snapshot) {
            if (snapshot.exists()) {
                snapshot.forEach(function(data) {
                    resolve({ ok: true, message: data.val() });
                });
            } else {
                reject({ ok: false, menssage: "Failed:No survey found for user received." });
            }
        });
    });
}

// Create Survey
app.post('/Survey', function(req, res) {
    let body = req.body;
    let userId = body['userID'];
    //Se obtiene la ruta del usuario
    let route = 'Survey/' + userId;
    //Se obtiene el IdUnico de la encuesta
    var rootRef = dataBase.ref().child(route).push();
    //Se obtienen los datos de la encuesta 
    let surveyBody = body['survey'];
    // Se inserta la encuesta
    rootRef.set(
        surveyBody,
        function(err) {

            if (err) {
                res.status(400).json({
                    ok: true,
                    message: err
                });
            } else {
                res.status(200).json({
                    ok: true,
                    message: "Success: Survey created."
                });
            }
        }
    );
});

app.listen(process.env.PORT, () => {
    console.log('Escuchando puerto:', process.env.PORT);
});