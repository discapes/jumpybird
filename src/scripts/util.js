Array.prototype.remove = function(removeElem) {
	this.splice(this.findIndex(elem => elem === removeElem), 1);
}

const dialogs = [];
export function dialog(text, duration, fadeduration) {
	let div = document.createElement("div");
	const offset = dialogs.reduce((prev, cur) => prev + cur.clientHeight + 10, 0) + 10;
	dialogs.push(div);
	div.style.top = offset + 'px';
	div.style.right = '10px';
	div.innerText = text;
	div.classList.add("dialog");
	document.body.appendChild(div);
	setTimeout(() => div.style.animation = `fade-out ${fadeduration}s`, duration * 1000);
	setTimeout(() => {
		dialogs.remove(dialog);
		div.remove()
	}, (duration + fadeduration) * 1000);
}

export class RemovableListener {
	constructor(type, listener, options) {
		this.type = type;
		this.listener = listener;
		this.options = options;
	}
	add() {
		window.addEventListener(this.type, this.listener, this.options);
	}
	remove() {
		window.removeEventListener(this.type, this.listener, this.options);
	}
}