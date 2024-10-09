function attachEventHandlers() {
	$('#account-selection').on('change', onAccountSelected);
	$('#folder-selection').on('change', onFolderSelected);
}

// Returns an <option> element which is primarily used in <select> elements
// to inform the user they need to choose an option in the drop down list.
function createDefaultOption(displayedText) {
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

// Recursively generate an array containing all parent folders
// and sub folders starting from an array of parent folders
function getAllFolders(parentFolders) {
	let subFolders = [];

	for (folder of parentFolders) {
		subFolders.push(folder);

		if (folder.subFolders.length == 0) { continue; }

		subFolders = subFolders.concat(getAllFolders(folder.subFolders));
	}

	return subFolders;
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
	let authorCounts = await getSortedAuthorCounts(folderID);

	$('#folder-information-panel').show();
	$('#folder-message-count').text(folderInfo.totalMessageCount);

	console.log(authorCounts);
}

// RFC2822 Section 3.4 details the specification for MailBoxHeaderStrings
// https://www.rfc-editor.org/rfc/rfc2822#section-3.4
// According to the spec. there is a section referred to as an "angle-addr"
// which contains the email address inside of it. In this API though, if
// the actual email address is the only component in the header string,
// there are no angle brackets and no additional information so we don't
// need to modify the string to extract the email address.
function extractEmailFromMailBoxHeaderString(headerString) {
	let emailStart = headerString.indexOf('<');
	let emailEnd = headerString.indexOf('>');

	// The entire header string is just the email with no other information
	if (emailStart == -1) {
		return headerString;
	}

	return headerString.substring(emailStart + 1, emailEnd);
}

// Create or increment the corresponding property of authorCounts
// based on the author of each message in the messages Array
function processMessages(messages, authorCounts) {
	for (headerString of messages.map(message => message.author)) {
		let author = extractEmailFromMailBoxHeaderString(headerString);

		if (author in authorCounts) {
			authorCounts[author] += 1;
		} else {
			authorCounts[author] = 1;
		}
	}
}

// author: email address
// count: number of messages received from that email address
class AuthorCount {
	constructor(author, count) {
		this.author = author;
		this.count = count;
	}
}

// Iterate through all messages corresponding to a given folderID and
// construct an Array of AuthorCount objects sorted in descending order
// such that the authors which have sent the highest volume of messages
// are closest to the beginning of the Array.
async function getSortedAuthorCounts(folderID) {
	let authorCounts = {};
	let page = await messenger.messages.list(folderID);

	// For every author, create a property in the authorCounts Object and
	// set the property value equal to the number of messages from said author
	processMessages(page.messages, authorCounts);

	while (page.id != null) {
		page = await messenger.messages.continueList(page.id);
		processMessages(page.messages, authorCounts);
	}

	// Convert authorCounts from an Object to an array of unsorted AuthorCount objects
	authorCounts = Object.keys(authorCounts).map(author => new AuthorCount(author, authorCounts[author]));

	// Finally, sort the authorCounts Array in descending order based on the AuthorCount.count property
	authorCounts.sort((author1, author2) => author2.count - author1.count);

	return authorCounts;
}

// Called when the page has finished loading and is ready
$(function() {
	attachEventHandlers();
	populateAccountSelection();
});