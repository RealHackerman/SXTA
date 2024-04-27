function req(endpoint, method, data) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onerror = function(err) {
            reject(new Error("XHTTP request failed.", {cause: err}));
        };
        xhr.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE) {
                if (parseInt(xhr.status) >= 400) {
                    return reject(
                        new Error(
                            `Request ${xhr.responseURL} returned status ${xhr.status}:${xhr.statusText}`, 
                        )
                    );
                }
                try {
                    this.responseJSON = JSON.parse(xhr.responseText);
                } catch(e) {}
                resolve(xhr);
            }
        };
        xhr.open(method, "/" + endpoint, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(data);
    });
}

function raiseInputError(elm, msg) {
    let inputGroup = elm.parentElement;
    elm.focus();
    inputGroup.lastElementChild.innerText = msg;
    inputGroup.className = "input-group error";
}

function clearInputError(elm) {
    if (elm.parentElement.className.split(" ").length > 1) elm.parentElement.className = "input-group";
}