const FILE_TYPES = {
	"video/x-matroska": "VIDEO_VLC",
	"video/mp4": "VIDEO",
	"video/webm": "VIDEO",
	"text/plain": "TEXT"
};

let ELEMENTS = getUIElements();

const URL_REGEX = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

let farms = [];
let currentFarm = 0;
let selectedFile = 0;

let statusInterval = null;

ELEMENTS.addFarmBtn.addEventListener('click', async () => {
	let farmURL = getValidURL(ELEMENTS.farmAddressInput.value.trim());
	if(farmURL){
		ELEMENTS.addFarmBtn.innerText = "Loading Farm...";
		await fetch(farmURL + "/info", {
			headers: {
				'Content-Type': "application/json"
			}
		}).then(a => a.json()).then(json => {
			if(!json.is_farm) return showNotification("Address provided is not a farm.", "error");

			let behbbleServerInfo = {
				name: "Anonymous Farm",
				description: "No description provided",
				farm_url: farmURL,
				...json
			};

			behbbleServerInfo.description = behbbleServerInfo.description.slice(0, 250);

			addNewFarm(behbbleServerInfo);

			ELEMENTS.farmAddressInput.value = "";
			showNotification(`Successfully added "${behbbleServerInfo.name}"!`, "success");
		}).catch(err => {
			console.error("ERROR:", err);
			showNotification("Unable to connect to that farm.", "error");
		});

		ELEMENTS.addFarmBtn.innerText = "Add";
	} else {
		showNotification("Invalid URL", "error");
	}
});

function addNewFarm(farmData) {
	farms.push({
		name: farmData.name,
		description: farmData.description,
		farm_url: farmData.farm_url,
		shepard: "",
		behbbles: []
	});

	updateFarmUI();
}

function removeFarm(index) {
	farms.splice(index, 1);

	updateFarmUI();
}

function updateFarmUI() {
	ELEMENTS.farmTabs.innerHTML = "";

	farms.forEach((farm, idx) => {
		ELEMENTS.farmTabs.innerHTML += `
			<li class="nav-item">
				<a class="nav-link ${currentFarm === idx ? "active" : ""}" data-index="${idx}" href="javascript:void(0)">${farm.name}</a>
			</li>
		`;
	});

	clearInterval(statusInterval);

	ELEMENTS.farmContent.innerHTML = "";
	if(!farms[currentFarm]) return;

	ELEMENTS.farmContent.innerHTML += `
		<h5 class="card-title">${farms[currentFarm].name}</h5>
		<p><b>Farm Capacity:</b> <span id="capacityPercentage">--</span>%</p>
		<pre class="card-text">${farms[currentFarm].description}</pre>
		<hr/>
		<div class="input-group">
			<span class="input-group-text">Shepard Query</span>
			<input type="text" class="form-control" id="queryText">
			<button class="btn btn-primary" type="button" id="callShepard">Call Shepard</button>
		</div>
		<hr>
		<div id="behbbles">
			<select class="form-select" id="behbbleSelect">
				<option selected>Choose a behbble...</option>
			</select>
			<div id="behbbleInfo">
				<pre>No file selected...</pre>
			</div>
			<button class="btn btn-primary mt-2 w-100" id="openBehbbleBtn">Open Behbble</button>
			<hr>
			<div id="behbbleData"></div>
		</div>
	`;

	updateBehbbleUI();

	getStatus();
	statusInterval = setInterval(() => {
		getStatus();
		if(farms[currentFarm].shepard) {
			getBehbbleList();
			updateBehbbleSelector();
		}
	}, 5000);

	resetFarmHandlers();
}

function updateBehbbleUI() {
	if(farms[currentFarm].behbbles.length === 0) {
		ELEMENTS.behbblesContainer.hidden = true;
	} else {
		updateBehbbleSelector();

		if(farms[currentFarm].behbbles[selectedFile]) {
			ELEMENTS.behbbleSelect.value = selectedFile;
			let behbble = farms[currentFarm].behbbles[selectedFile];

			ELEMENTS.behbbleInfoText.innerHTML = `<pre>
Name: ${behbble.name}
Type: ${behbble.type}
Grazing Level: ${Math.max(Math.floor(behbble.grazing * 100), 0)}%
</pre>
<p><b>Stream URL:</b> <a href="${behbble.stream_url}" target="_blank">${behbble.stream_url}</a></p>
`;

			ELEMENTS.openBehbbleBtn.innerText = `Open Behbble (File #${selectedFile})`;
			ELEMENTS.openBehbbleBtn.disabled = false;
		}
	}
}

function updateBehbbleSelector() {
	const oldValue = ELEMENTS.behbbleSelect.value;

	ELEMENTS.behbbleSelect.innerHTML = `<option selected>Choose a behbble...</option>`;

	farms[currentFarm].behbbles.forEach((behbble, idx) => {
		ELEMENTS.behbbleSelect.innerHTML += `<option value="${idx}">${behbble.name.slice(0, 30)} (${Math.max(Math.floor(behbble.grazing * 100), 0)})%</option>`;
	});

	ELEMENTS.behbbleSelect.value = oldValue;
}

function getStatus() {
	if(!farms[currentFarm]) return;
	fetch(farms[currentFarm].farm_url + "/status", {
		headers: {
			'Content-Type': 'application/json',
			'pragma': 'no-cache',
			'Cache-Control': 'no-cache'
		}
	}).then(a => a.json()).then(json => {
		if(json.err) {
			removeFarm(currentFarm);
			return showNotification("Unable to get farm status.", "error");
		}

		ELEMENTS.capacityPercentage.innerText = Math.floor(json.capacity * 100);
	});
}

async function getBehbbleList() {
	let json = await fetch(farms[currentFarm].farm_url + "/shepard/" + farms[currentFarm].shepard, {
		headers: {
			'Content-Type': 'application/json',
			'pragma': 'no-cache',
			'Cache-Control': 'no-cache'
		}
	}).then(a => a.json());

	if(json.err) {
		farms[currentFarm].shepard = "";
		farms[currentFarm].behbbles = [];
		updateFarmUI();

		return showNotification("Unable to get behbbles: " + json.err, "error");
	}

	farms[currentFarm].behbbles = json.behbbles.map((b, idx) => ({
		...b,
		stream_url: `${farms[currentFarm].farm_url}/behbble/${farms[currentFarm].shepard}/${idx}`
	}));
}

function resetFarmHandlers() {
	ELEMENTS.callShepardBtn.addEventListener('click', async () => {
		let query = ELEMENTS.queryInput.value.trim();
		if(query === "") return;

		ELEMENTS.callShepardBtn.innerText = "Calling Shepard...";
		ELEMENTS.callShepardBtn.disabled = true;

		let json = await fetch(farms[currentFarm].farm_url + "/call_shepard", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				'pragma': 'no-cache',
				'Cache-Control': 'no-cache'
			},
			body: JSON.stringify({
				query: query
			})
		}).then(a => a.json());

		ELEMENTS.callShepardBtn.innerText = "Call Shepard";
		ELEMENTS.callShepardBtn.disabled = false;

		if(json.err) {
			return showNotification("Unable to call shepard: " + json.err, "error");
		}

		farms[currentFarm].shepard = json.shepard;

		await getBehbbleList();

		updateFarmUI();
	});

	ELEMENTS.behbbleSelect.addEventListener('change', () => {
		selectedFile = Number(ELEMENTS.behbbleSelect.value);

		updateBehbbleUI();
	});

	ELEMENTS.openBehbbleBtn.addEventListener('click', () => {
		displayBehbble(farms[currentFarm].behbbles[selectedFile]);

		ELEMENTS.openBehbbleBtn.disabled = true;
	});
}

function displayBehbble(behbble) {
	ELEMENTS.behbbleData.innerHTML = "";

	if(FILE_TYPES[behbble.type]) {
		if(FILE_TYPES[behbble.type].startsWith("video/")) {
			if(FILE_TYPES[behbble.type] === "VIDEO_VLC") {
				ELEMENTS.behbbleData.innerHTML += `
					<p>These types of files usually don't play well on browsers. Use VLC to ensure it plays correctly.</p><br>
				`;
				if(getOS() === "Android") {
					ELEMENTS.behbbleData.innerHTML += `<button id="openStream">Open Stream</button>`;
					// ELEMENTS.behbbleData.innerHTML += `
					// 	<a href="intent://${behbble.stream_url}${isMKV(behbble.type) ? ".mp4" : behbble.type.toLowerCase()}#Intent;action=android.intent.action.VIEW;category=android.intent.category.DEFAULT;scheme=vlc;package=org.videolan.vlc;end">Open in VLC</a>
					// `;
				} else {
					ELEMENTS.behbbleData.innerHTML += `
						<p>Use the Stream URL inside VLC by opening a "Network Stream" (CTRL-N on Windows).</p>
					`;
				}
			}

			ELEMENTS.behbbleData.innerHTML += `
				<video class="behbble-video" controls>
					<source src="${behbble.stream_url}" type="video/${behbble.type === ".WEBM" ? "webm" : "mp4"}">
					Your browser does not support the video tag.
				</video>
			`;
		}
	}

	if(ELEMENTS.openStreamBtn){
		ELEMENTS.openStreamBtn.addEventListener('click', async () => {
			try {
				await navigator.share({
					// title: farms[currentFarm].behbbles[selectedFile].name,
					// text: farms[currentFarm].behbbles[selectedFile].name,
					url: farms[currentFarm].behbbles[selectedFile].stream_url
				});
			} catch(err) {
				showNotification("Unable to open third-party selections: " + err, "error");
			}
		});
	}
}