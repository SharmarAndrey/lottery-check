// Cargar todo el JSON y lo ponemos en una variable
const lottery = require('./data/lottery.json');
const prizes = require('./data/prizes.json'); // Cargar el JSON con los premios

// Importar el paquete de terceros que acabamos de instalar
const express = require('express');
const logger = require('morgan');

// Es generarme un objeto para gestionar el enrutamiento y otros aspectos de la aplicación
const app = express();

// Añadimos el middleware de morgan para loguear todas las peticiones que haga un cliente
app.use(logger('dev'));

// Nos gustaría que también gestionaras los datos de tipo JSON (entre ellos los POST que nos lleguen)
app.use(express.urlencoded({ extended: true }));  // Middleware para parsear datos de formularios
app.use(express.json()); // Middleware para parsear JSON

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
})

app.get('/api/check-date', (req, res) => {
	const date = req.query.date;
	const item = lottery.find(raffle => raffle.draw_date.includes(date));
	if (item) {
		res.send({
			message: "Draw found",
			winningNumbers: `${item.winning_numbers} ${item.supplemental_numbers} ${item.super_ball}`
		});
	} else {
		res.status(404).send({
			message: "Draw not found for the given date"
		});
	}
});

// /api/get-computed-results?date=2024-06-18&playedNumbers=2 3 20 33 44 50 02
app.get('/api/get-computed-results', (req, res) => {
	// 1. Extraer los valores de 'date' y 'playedNumbers'
	const date = req.query.date;
	const playedNumbersString = req.query.playedNumbers;
	const playedNumbers = playedNumbersString.split(' ').map(Number); // Convertir los números a un array de números

	// 2. Encontrar el sorteo según la fecha
	const item = lottery.find(raffle => raffle.draw_date.includes(date));

	// 3. Verificar si el sorteo existe
	if (item) {
		const winningNumbers = item.winning_numbers.split(' ').map(Number);
		const supplementalNumbers = item.supplemental_numbers.split(' ').map(Number);
		const superBall = Number(item.super_ball);

		// 4. Contar cuántas coincidencias hay entre playedNumbers y winningNumbers
		const matchedNumbers = playedNumbers.filter(number => winningNumbers.includes(number)).length;
		const matchedSupplemental = playedNumbers.filter(number => supplementalNumbers.includes(number)).length;
		const matchedSuperBall = playedNumbers.includes(superBall) ? 1 : 0;

		// 5. Calcular el total de coincidencias
		const totalMatches = matchedNumbers + matchedSupplemental + matchedSuperBall;

		// 6. Calcular el premio obtenido según prizes.json
		const prizeData = prizes.find(prize => prize.match_numbers === totalMatches);
		const prize = prizeData ? prizeData.prize : 0;

		// 7. Enviar la respuesta con el número de coincidencias y el dinero ganado
		res.send({
			matchNumbers: totalMatches,
			prize
		});
	} else {
		res.status(404).send({
			message: "Draw not found for the given date"
		});
	}
});

// Levantar el servidor
app.listen(3000, () => {
	console.log("Servidor corriendo en el puerto 3000.");
});
