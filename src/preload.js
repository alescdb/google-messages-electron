const {ipcRenderer} = require('electron');

let previousCount = 0;

function getUnreadCount() {
  return document.body.querySelectorAll('a[data-e2e-is-unread="true"]')?.length ?? 0;
}

function checkUnread() {
  const count = getUnreadCount();

  console.log(`checkUnread(${count})`);
  if (count !== previousCount) {
    previousCount = count;
    ipcRenderer.send('unread', count);
  }
}

// noinspection JSUnusedLocalSymbols
function waitForConversationList() {
  const conversationList = document.body.querySelector('.conversation-list');
  if (!conversationList) {
    console.log('conversation-list not found, waiting...');
    setTimeout(waitForConversationList, 1000);
  } else {
    console.log('conversation-list found');
    checkUnread();
    conversationList.addEventListener('change', () => {
      console.log('conversation-list changed !');
      checkUnread();
    });
  }
}

window.addEventListener('load', () => {
  console.log('content loaded');
  // waitForConversationList();
  setInterval(checkUnread, 3000);
});

