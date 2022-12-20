const { ethereum } = window;
const STORAGE_STUB = "worlcoin_tester";

const abi = [
	"function verifyAndExecute(address, uint256, uint256, uint256[8]) external",
];

let accounts, verifiedProof, unsavedChanges;

window.onload = load();

async function load() {
	eventListeners();
	getAccount();
	loadData();
	initWID();
	setSignal();
}


function initWID() {
	
	console.log("init World ID widget");

	const _action_id = document.getElementById("actionId").value;
	if (!_action_id) {
		console.log("Action ID required to initialise WID widget");
		showError(["actionId", "actionId_Btn"]);
		return;
	}

	worldID.init("world-id-container", {
		enable_telemetry: false,
		action_id: _action_id,
		on_success: onWorldIDVerified, // callback function receives proof after verification on simulator
	});
}


// callback function receives proof after verification on simulator
function onWorldIDVerified(proof) {
	console.log("world id verified!!");
	console.log(proof);
	verifiedProof = proof;
	document.getElementById("autoLoad").checked && loadProof();
}

// connect metamask
async function connectWallet() {
	if(!accounts.length === 0) return;
	accounts = await ethereum.request({ method: "eth_requestAccounts" });
	if (accounts.length !== 0) {
		const account = accounts[0];
		console.log("Found an authorized account:", account);
		document.getElementById("walletAddress").value = account.slice(0,6) + ".." + account.slice(-6);
	} else {
		document.getElementById("walletAddress").value = "connect wallet";
		console.log("No authorized account found");
	}

	const chainId = await ethereum.request({ method: "eth_chainId" });
	console.log("chainId: ", chainId);
}


// gets connected wallet account
async function getAccount() {
	accounts = await ethereum.request({ method: "eth_accounts" });
	if (accounts.length !== 0) {
		const account = accounts[0];
		console.log("Found an authorized account:", account);
		document.getElementById("walletAddress").value = account.slice(0,6) + ".." + account.slice(-6);
	} else {
		document.getElementById("walletAddress").value = "connect wallet";
		console.log("No authorized account found");
	}

	const chainId = await ethereum.request({ method: "eth_chainId" });
	console.log("chainId: ", chainId);
}


// copy the connected wallet address to the clipboard
function copyWalletAddress() {
	if(accounts[0]) {
		navigator.clipboard.writeText(accounts[0]);
	} else {
		console.log("no wallet connected");
		showError(["walletAddress"]);
	}
}


// action id can't be updated even though it doesn't throw and error, it doesn't work
// have to save actionId element and reload page so it is initialised with the new id
function setActionId() {
	const newActionId = document.getElementById("actionId").value;
	if(newActionId){
		localStorage.setItem(STORAGE_STUB + "actionId", JSON.stringify(newActionId));
		console.log("updated action id: ", newActionId);
		window.location.reload();
	} else {
		showError(["actionId", "actionId_Btn"]);
	}
}


// to set/update the signal param
function setSignal() {
	
	try {worldID.getProps().length;}
	catch {
		showError(["actionId", "actionId_Btn"]);
		console.log("World ID widget not intialised");
		return;
	}
	console.log("worldID", worldID.getProps().length == 0);
	
	const signal = document.getElementById("inputSignal").value;
	if(signal){
		worldID.update({
			signal: signal,
		});
		// document.getElementById("inputSignal").value = newSignal;
		console.log("updated signal: ", signal);
		console.log("WID widget props:", worldID.getProps()); // log proof that the signal is what it should be
	} else {
		showError(["inputSignal", "signal_Btn"]);
	}
}


// call verifyAndExecute on the smart contract
async function verifyProof() {
	try {
		const { ethereum } = window;
		if (ethereum) {

			const missingInputs = [];
			
			if(accounts.length === 0) missingInputs.push(["walletAddress"]);

			const contractAddress = document.getElementById("contractAddress").value;
			!contractAddress && missingInputs.push("contractAddress");
			console.log("contract address:", contractAddress);
			console.log("address is typeof:", typeof contractAddress);

			const signal = document.getElementById("inputSignal").value;
			!signal && missingInputs.push("inputSignal");
			console.log("signal:", signal);
			
			let root = document.getElementById("inputMerkRoot").value
			if(!root) missingInputs.push("inputMerkRoot");
			else root = ethers.BigNumber.from(root);
			console.log("merkle root:", root);
			
			
			let nullifier = document.getElementById("inputNullHash").value
			if(!nullifier) missingInputs.push("inputNullHash");
			else nullifier = ethers.BigNumber.from(nullifier);
			console.log("nullifier hash:", nullifier);

			const proof = document.getElementById("inputProof").value;
			!proof && missingInputs.push("inputProof");


			if(missingInputs.length) {
				showError(missingInputs);
				console.log("required inputs missing:",...missingInputs)
				return;
			}


			const unpackedProof = ethers.utils.defaultAbiCoder.decode(
				["uint256[8]"],
				proof
			)[0];
			console.log("unpacked proof");
			console.log(unpackedProof);
			console.log("/unpacked proof");

			console.log("get provider");
			const provider = new ethers.providers.Web3Provider(ethereum);
			console.log("get signer")
			const signer = provider.getSigner();
			console.log("connect to contract")
			// const connectedContract = new ethers.Contract(
			// 	contractAddress,
			// 	abi,
			// 	signer
			// );

			console.log('Version: ' + process.version);
			const connectedContract = new ethers.Contract(
				'0xd57dAFCF4Efb58D3d0fD0C36216B6b189Ca67324',
				abi,
				signer
			);



			try {
				console.log("verifyAndExecut");
				const retVal = await connectedContract.verifyAndExecute(
					signal,
					root,
					nullifier,
					unpackedProof,
					{ gasLimit: 800000 }
				);
				await retVal.wait();
				console.log("result: ", retVal);
			} catch (error) {
				console.log("error:", error);
			}
		} else {
			showError(["walletAddress"]);
			console.log("Ethereum object doesn't exist!");
		}
	} catch (error) {
		console.log(error);
	}
}


// populate the verifyAndExecute proof inputs with the most recently received 
// verified proof: merkle root, nullifier hash, & packed proof
function loadProof() {
	console.log("load proof");
	document.getElementById("inputMerkRoot").value = verifiedProof.merkle_root;
	document.getElementById("inputNullHash").value = verifiedProof.nullifier_hash;
	document.getElementById("inputProof").value = verifiedProof.proof;
}


// save inputs and text area state
function saveData() {
	const allSaveableElements = document.getElementsByClassName("saveable");
	
	Object.values(allSaveableElements).forEach((element) => {
		let value = element.type == "checkbox" ? element.checked : element.value
		
		localStorage.setItem(
			STORAGE_STUB + element.id,
			JSON.stringify(value)
		);
	});
	console.log("saved state")
	unsavedChanges = false;
}


// load saved state back into inputs and text area
function loadData() {
	const allSaveableElements = document.getElementsByClassName("saveable");

	Object.values(allSaveableElements).forEach((element) => {
		if(element.type == "checkbox") {
			element.checked = JSON.parse(localStorage.getItem(STORAGE_STUB + element.id));
			// console.log("loaded %s: ", element.id, element.checked);
		} else {
			element.value = JSON.parse(localStorage.getItem(STORAGE_STUB + element.id));
			// console.log("loaded %s: ", element.id, element.value);
		}
	});
	console.log("loaded state")
}


// event listeners
function eventListeners() {
	// event listeners
	console.log("event listeners");

	const copyIcon = document.getElementById("walletCopy");
	copyIcon.addEventListener(
		"click",
		function () {
			copyWalletAddress();
		},
		false
	);

	const walletAddressBox = document.getElementById("walletAddress")
	walletAddressBox.addEventListener(
		"click",
		function () {
			connectWallet();
		},
		false
	);

	const actionId_Btn = document.getElementById("actionId_Btn");
	actionId_Btn.addEventListener(
		"click",
		function () {
			setActionId();
		},
		false
	);

	const signal_Btn = document.getElementById("signal_Btn");
	signal_Btn.addEventListener(
		"click",
		function () {
			setSignal();
		},
		false
	);

	const save_Btn = document.getElementById("save_Btn");
	save_Btn.addEventListener(
		"click",
		function () {
			saveData();
		},
		false
	);

	const verify_Btn = document.getElementById("verify_Btn");
	verify_Btn.addEventListener(
		"click",
		function () {
			verifyProof();
		},
		false
	);

	const loadProof_Btn = document.getElementById("loadProof_Btn");
	loadProof_Btn.addEventListener(
		"click",
		function () {
			loadProof();
		},
		false
	);

	// prompt if leaving page with unsaved changes
	window.onbeforeunload = function () {
		console.log("leaving with unsaved changes?");
		if (unsavedChanges) return "leaving page with unsaved changes?";
	};

	// list for metamask account change
	ethereum.on('accountsChanged', function () {
		console.log("account changed");
		getAccount();
	})

	// listen for saveable changes
	addEventListener("input", (evt) => {
		if (!unsavedChanges && evt.target.classList.contains("saveable")) {
			console.log("unsaved changes");
			unsavedChanges = true;
		}
	});

	// ctrl + s shortcut calls page saveData()
	document.addEventListener("keydown", (event) => {
		if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
			event.preventDefault(); //prevent browser save dialogue
			console.log("ctrl + s: save");
			saveData();
		}
	});
}


// highlight elements in error : takes an array of elements
function showError(targetElements) {
	targetElements.forEach((element) => {
		const tgt = document.getElementById(element);
		tgt.classList.add("errorEffects");
		setTimeout(() => tgt.classList.remove("errorEffects"), 2000);
	});
}
