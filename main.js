const { PI, sqrt, sin, cos } = Math;
const TAU = PI * 2;

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const EARTH = 'earth';
const SUN = 'sun';

const EARTH_RAD = 6371;
const MOON_RAD = 1737.4;
const MOON_DIST = 384400;
const SUN_RAD =	695660;
const SUN_DIST = 149597870.7;

const HOUR = 1;
const DAY = 24 * HOUR;
const SID_DAY = 23.9344696 * HOUR;
const LUNAR_PERIOD = 27.322 * DAY;
const SID_YEAR = 365.256363004 * DAY;

const EARTH_RAD_2 = 20;
const MOON_RAD_2 = 10;
const SUN_RAD_2 = 50;
const SUN_DIST_2 = 300;
const MOON_DIST_2 = 80;

let center = EARTH;
let time = 0;
let correctness = 0;

let earth_rad = 20;
let moon_rad = 10;
let sun_rad = 50;
let sun_dist = 300;
let moon_dist = 80;
let scale = 1;

let year_angle = 0;
let moon_angle = 0;
let earth_angle = 0;
let sun_x = 0;
let sun_y = 0;
let earth_x = 0;
let earth_y = 0;
let moon_x = 0;
let moon_y = 0;
let coord00_x;
let coord00_y;

const adjustScale = (trueValue, targetValue) => {
	const ratio = trueValue/targetValue;
	const log = Math.log(ratio);
	return targetValue * Math.exp(log * correctness) * scale;
};

const setCorrectness = (value) => {
	const [ objTrueRad, objTargetRad ] = center == EARTH ? [
		EARTH_RAD, EARTH_RAD_2,
	] : [
		SUN_RAD, SUN_RAD_2,
	];
	const prevRad = adjustScale(objTrueRad, objTargetRad);
	correctness = value;
	const nextRad = adjustScale(objTrueRad, objTargetRad);
	scale *= prevRad / nextRad;
};

const round = (value, n = 0) => {
	return Number(value.toFixed(n));
};

const normalize = (x, y) => {
	const s = 1/sqrt(x**2 + y**2);
	return [ x*s, y*s ];
};

const calcAngle = (dx, dy) => {
	const l = sqrt(dx**2 + dy**2);
	const temp = Math.acos(dx/l);
	return dy < 0 ? TAU - temp : temp;
};

const threePointsAngle = (ax, ay, px, py, bx, by) => {
	const a1 = calcAngle(ax - px, ay - py);
	const b1 = calcAngle(bx - px, by - py);
	return (b1 - a1 + TAU) % TAU;
};

const strAngle = (angle) => {
	const deg = angle / PI * 180;
	return round(deg, 2).toString();
};

const strTime = () => {
	const hours = round(time % 24, 1);
	const days = round((time - hours) / 24);
	return `${days}d ${hours}h`;
};

const textLines = [];

const update = () => {
	year_angle = time / SID_YEAR * TAU;
	moon_angle = time / LUNAR_PERIOD * TAU;
	earth_angle = time / SID_DAY * TAU;

	earth_rad = adjustScale(EARTH_RAD, EARTH_RAD_2);
	sun_dist = adjustScale(SUN_DIST, SUN_DIST_2);
	sun_rad = adjustScale(SUN_RAD, SUN_RAD_2);
	moon_dist = adjustScale(MOON_DIST, MOON_DIST_2);
	moon_rad = adjustScale(MOON_RAD, MOON_RAD_2);

	sun_x = 0;
	sun_y = 0;

	earth_x = sun_x + sun_dist*cos(year_angle);
	earth_y = sun_y + sun_dist*sin(year_angle);

	moon_x = earth_x + moon_dist*cos(moon_angle);
	moon_y = earth_y + moon_dist*sin(moon_angle);

	if (center == EARTH) {
		moon_x -= earth_x;
		moon_y -= earth_y;
		sun_x -= earth_x;
		sun_y -= earth_y;
		earth_x = 0;
		earth_y = 0;
	}

	coord00_x = earth_x - cos(earth_angle) * earth_rad;
	coord00_y = earth_y - sin(earth_angle) * earth_rad;
	
	textLines.length = 0;
	textLines.push(
		`Time: ${strTime()}`,
		`Angle Sun-Moon: ${strAngle(threePointsAngle(moon_x, moon_y, earth_x, earth_y, sun_x, sun_y))}`,
		`Sun LHA: ${strAngle(threePointsAngle(earth_x, earth_y, coord00_x, coord00_y, sun_x, sun_y))}`,
		`Moon LHA: ${strAngle(threePointsAngle(earth_x, earth_y, coord00_x, coord00_y, moon_x, moon_y))}`,
	);
};

const fillCircle = (x, y, rad, color) => {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, rad, 0, TAU);
	ctx.fill();
};

const drawMedidean = () => {
	ctx.strokeStyle = '#fff';
	ctx.beginPath();
	ctx.moveTo(earth_x, earth_y);
	ctx.lineTo(coord00_x, coord00_y);
	ctx.stroke();
};

const drawShadowLine = () => {
	const dx = moon_x - sun_x;
	const dy = moon_y - sun_y;
	const m = moon_dist * 2 / sqrt(dx**2 + dy**2);
	ctx.globalAlpha = 0.75;

	ctx.strokeStyle = '#ff0';
	ctx.beginPath();
	ctx.moveTo(sun_x, sun_y);
	ctx.lineTo(moon_x, moon_y);
	ctx.stroke();

	ctx.strokeStyle = '#f00';
	ctx.beginPath();
	ctx.moveTo(moon_x, moon_y);
	ctx.lineTo(moon_x + dx*m, moon_y + dy*m);
	ctx.stroke();

	ctx.globalAlpha = 1;
};

const drawRefLines = () => {
	ctx.strokeStyle = '#0f7';
	ctx.beginPath();
	ctx.moveTo(sun_x, sun_y);
	ctx.lineTo(earth_x, earth_y);
	ctx.stroke();

	ctx.strokeStyle = '#70f';
	ctx.beginPath();
	ctx.moveTo(moon_x, moon_y);
	ctx.lineTo(earth_x, earth_y);
	ctx.stroke();
};

const render = () => {
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	update();

	ctx.setTransform(
		1, 0,
		0, -1,
		canvas.width/2,
		canvas.height/2,
	);

	drawRefLines();
	drawShadowLine();

	fillCircle(sun_x, sun_y, sun_rad, '#ffe');
	fillCircle(earth_x, earth_y, earth_rad, '#07f');
	fillCircle(moon_x, moon_y, moon_rad, '#444');
	drawMedidean();

	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.font = '16px monospace';
	ctx.fillStyle = '#fff';
	ctx.textBaseline = 'top';
	ctx.textAlign = 'left';
	textLines.forEach((line, i) => {
		const x = 10;
		const y = 10 + i * 26;
		ctx.fillText(line, x, y);
	});
};

const resizeCanvas = () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	render();
};

resizeCanvas();

window.addEventListener('resize', resizeCanvas);
window.addEventListener('wheel', e => {
	scale *= 1 - Math.sign(e.deltaY) * 0.1;
	render();
});
window.addEventListener('keydown', e => {
	if (e.code === 'Enter') {
		center = center === EARTH ? SUN : EARTH;
	}
	render();
});
document.querySelector('input[name=correctness]').addEventListener('input', function() {
	setCorrectness(Number(this.value));
	render();
});
document.querySelector('input[name=time]').addEventListener('input', function() {
	time = Number(this.value);
	render();
});
