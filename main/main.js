async function refreshAccounts() {
	var accounts = await messenger.accounts.list();

	$('#account-selection').on('change', onAccountSelected);

	for (account of accounts) {
		$('#account-selection').append(
			$('<option>', {
				text: account.name,
				value: account.id
			})
		);
	}
}

async function onAccountSelected() {
	let accountID = $('#account-selection').val();
	let account = await messenger.accounts.get(accountID);
	let rootFolder = await messenger.folders.get(account.rootFolder.id, true);
	let folders = getAllFolders(rootFolder.subFolders);

	$('#account-name').text(account.name);
	$('#account-folder-count').text(folders.length);
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

$(document).ready(() => {
	refreshAccounts();
});