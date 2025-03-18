const body = document.body;
let back_button = document.createElement('a');
back_button.textContent = "Back";
back_button.href = "../index.html";
back_button.style.position = "absolute";
back_button.style.top = "5px";
back_button.style.left = "5px";
back_button.style.borderRadius = "5px";
back_button.style.textDecoration = "none";
back_button.style.color = "white";
back_button.style.border = "1.5px solid white";
back_button.style.padding = "4px";
back_button.style.fontWeight = "700";

body.appendChild(back_button);