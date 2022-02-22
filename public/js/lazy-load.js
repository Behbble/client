window.addEventListener('load', function() {
	document.querySelectorAll("[high-res-src]").forEach(elem => {
		let highResURL = elem.attributes.getNamedItem("high-res-src").value;

		let image = new Image();
		image.addEventListener('load', () => elem.src = highResURL);
		image.src = highResURL;
	});
});