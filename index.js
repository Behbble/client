require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');

const Minifier = require('./minifier');

const PORT = process.env.PORT || 80;

const app = express();
const httpServer = http.Server(app);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, 'public')));

console.log("Minifying client files...");
Minifier(process.env.NODE_ENV === 'development').then(() => {
	httpServer.listen(PORT, function(){
		console.log('listening on *:' + PORT);
	});
}).catch(console.error);