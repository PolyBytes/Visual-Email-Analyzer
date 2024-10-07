function attachEventHandlers()
{
	$('#account-selection').on('change', onAccountSelected);
	$('#folder-selection').on('change', onFolderSelected);
}

async function populateAccountSelection() {
	let accounts = await messenger.accounts.list();

	$('#account-selection').empty();
	$('#account-selection').append(createDefaultOption('Select an Account'));

	for (account of accounts) {
		let newAccountOption = $('<option>', {
			text: account.name,
			value: account.id
		});

		$('#account-selection').append(newAccountOption);
	}
}

async function onAccountSelected() {
	$('#folder-information-panel').hide();

	let accountID = $('#account-selection').val();
	let account = await messenger.accounts.get(accountID);
	let rootFolder = await messenger.folders.get(account.rootFolder.id, true);
	let accountFolders = getAllFolders(rootFolder.subFolders);

	$('#account-name').text(account.name);
	$('#account-folder-count').text(accountFolders.length);

	populateFolderSelection(accountFolders);

	$('#folder-selection-panel').show();
}

function populateFolderSelection(accountFolders) {
	$('#folder-selection').empty();
	$('#folder-selection').append(createDefaultOption('Select a Folder'));

	for (folder of accountFolders) {
		let newFolderOption = $('<option>', {
			text: folder.name,
			value: folder.id
		});

		$('#folder-selection').append(newFolderOption);
	}
}

async function onFolderSelected() {
	let folderID = $('#folder-selection').val();
	let folderInfo = await messenger.folders.getFolderInfo(folderID);

	$('#folder-information-panel').show();
	$('#folder-message-count').text(folderInfo.totalMessageCount);
}

// Recursively generate an array containing all folders
// and sub folders starting from an array of folders
function getAllFolders(rootFolders) {
	let folders = [];

	for (folder of rootFolders) {
		folders.push(folder);

		if (folder.subFolders.length == 0) { continue; }

		folders = folders.concat(getAllFolders(folder.subFolders));
	}

	return folders;
}

// Returns an <option> element which is primarily used in <select> elements
// to inform the user they need to choose an option in the drop down list.
function createDefaultOption(displayedText)
{
	let option = $('<option>', {
		text: displayedText,
		value: ''
	});

	option.prop({
		'selected': true,
		'disabled': true,
		'hidden': true
	});

	return option;
}

// Called when the page has finished loading and is ready
$(function() {
	attachEventHandlers();
	populateAccountSelection();
});