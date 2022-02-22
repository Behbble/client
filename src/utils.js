function toFixed(num, amount) {
	return Number(num.toFixed(amount));
}

function showNotification(message, type="alert") {
	new Noty({
		type,
		text: message,
		layout: "bottomLeft",
		timeout: 5000
	}).show();
}

function getOS() {
	let userAgent = navigator.userAgent.toLowerCase();

	if(userAgent.includes("android")) return "Android";
	if(userAgent.includes("win")) return "Windows";
	if(userAgent.includes("mac")) return "MacOS";
	if(userAgent.includes("x11")) return "UNIX";
	if(userAgent.includes("linux")) return "Linux";

	return "Unknown OS";
}

function isMKV(str) {
	return str.toLowerCase().includes("mkv");
}

function getValidURL(str) {
	if(typeof str !== 'string') return false;
	if(!str.startsWith('http')) str = 'http://' + str;

	try { new URL(str); } catch(e) {
		return false;
	}

	if(str[str.length - 1] === '/') str = str.slice(0, -1);

	return str;
}

function getUIElements() {
	class elems {
		constructor() {}

		get addFarmBtn() { return document.querySelector('#addFarm'); }
		get farmAddressInput() { return document.querySelector('#farmAddressText'); }
		get farmTabs() { return document.querySelector('#farmTabs'); }
		get farmContent() { return document.querySelector('#farmContent'); }
		get behbblesContainer() { return document.querySelector('#behbbles'); }
		get behbbleSelect() { return document.querySelector('#behbbleSelect'); }
		get behbbleInfoText() { return document.querySelector('#behbbleInfo'); }
		get openBehbbleBtn() { return document.querySelector('#openBehbbleBtn'); }
		get openStreamBtn() { return document.querySelector('#openStream'); }
		get capacityPercentage() { return document.querySelector('#capacityPercentage'); }
		get callShepardBtn() { return document.querySelector('#callShepard'); }
		get queryInput() { return document.querySelector('#queryText'); }
		get behbbleData() { return document.querySelector('#behbbleData'); }
	};

	return new elems();
}