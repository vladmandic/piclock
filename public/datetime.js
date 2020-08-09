/* global moment */

let last = new Date(0);

function updateNumber(element, number) {
  const second = element.lastElementChild.cloneNode(true);
  second.textContent = number;
  element.classList.add('move');
  element.appendChild(second);
  setTimeout(() => {
    element.classList.remove('move');
    element.removeChild(element.firstElementChild);
  }, 750);
}

function updateContainer(container, time) {
  const s = time.toString().padStart(2, '0').split('');
  const first = container.firstElementChild;
  if (first.lastElementChild.textContent !== s[0]) updateNumber(first, s[0]);
  const second = container.lastElementChild;
  if (second.lastElementChild.textContent !== s[1]) updateNumber(second, s[1]);
}

function updateTime() {
  const now = new Date();
  if (last.getHours() !== now.getHours()) updateContainer(document.getElementById('hours'), now.getHours());
  if (last.getMinutes() !== now.getMinutes()) updateContainer(document.getElementById('minutes'), now.getMinutes());
  if (last.getSeconds() !== now.getSeconds()) updateContainer(document.getElementById('seconds'), now.getSeconds());
  last = now;
}

async function updateDate() {
  document.getElementById('date').innerHTML = `
    ${moment().format('dddd')}, 
    ${moment().format('MMMM Do')}
    ${moment().format('YYYY')}
  `;
}

function dateTime() {
  // eslint-disable-next-line no-console
  console.log('Initializing DateTime handler');
  updateTime();
  updateDate();
  setInterval(updateTime, 1000);
  setTimeout(updateDate, 5 * 60 * 1000);
}

window.dateTime = dateTime;
