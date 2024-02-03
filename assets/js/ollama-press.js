const chat_log_id = document.querySelector("#chat_log_id");
const message = document.querySelector("#message");
const models = document.querySelector("#model");
const prompt = document.querySelector("#prompt");
const response = document.querySelector("#op-response");
const submit = document.querySelector("#submit");
const welcome = document.querySelector("#op-hello");

// HTMx
htmx.config.defaultFocusScroll = true;
htmx.config.ignoreTitle = true;

// Render markdown to HTML per request
async function render(opts = {}) {
    // Ensure everything is initialized
    await this.waitForReady()

    // Start generating markdown HTML string in parallel
    const pending = this.buildMd(opts)

    // Insert or replace styles into DOM
    const styles = await this.stampStyles(this.buildStyles())
    await this.tick()

    // Insert or replace body into DOM
    const body = await this.stampBody(await pending, opts.classes)

    // Finally, fire the rendered event
    this.fire('zero-md-rendered', { stamped: { styles, body } })
}

// After submit 
function afterSubmit() {
    clearPrompt();
}

function clearChat() {
    // Append to end of response
    var opResponse = document.querySelector("#op-response");
    opResponse.innerHTML = '<div id="op-dialog"></div>';
}

function clearHome() {
    // if op-response is not empty, hide welcome message
    if (response.innerHTML != '') {
        welcome.style.display = 'none';
    }
}

// When submit XHR is complete focus on the textarea #prompt and clear the value
function clearPrompt() {
    prompt.value = '';
}

// Copy message to prompt
function copyMessage() {
    // Store message in hidden field so we can clear the textarea
    prompt.value = message.value;

    // Clear message
    message.value = '';
    message.placeholder = 'Message Ollama...';
    message.focus();
}

// Check if the message is empty
// https://stackoverflow.com/a/3261380/1007492
function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

function onClickChange() {
    htmx.onLoad(function (content) {
        // If the content is a form, clear the prompt and scroll to the bottom
        afterSubmit();
    });

    // Clear welcome screen
    clearHome();

    // Copy message to prompt, clear message
    copyMessage();
}

function copyToClipboard(id) {
    // build vars for response and button using id
    var btn = document.getElementById('copy-' + id);

    // copy response to clipboard
    var copyText = getResponseInnerHTML(id);

    // clean up the response
    copyText = copyText.replace(/<zero-md><script type="text\/markdown">/g, '');
    copyText = copyText.replace(/<\/script><\/zero-md>/g, '');
    copyText = copyText.trim();

    // copy and alert user
    navigator.clipboard.writeText(copyText).then(() => {
        // change button text
        btn.innerHTML = 'inventory';

        // After sleep of 5 seconds, change button text back to copy
        setTimeout(function () {
            btn.innerHTML = 'content_paste';
        }, 2600);
    });
}

// JS to append fadeout CSS class to the element after timeout 
function fadeOut(id, timeout = 2600, class_name = 'fadeOut') {
    var element = document.getElementById(id);

    // After timeout, add the class to the element
    setTimeout(function () {
        element.classList.add(class_name);
    }, timeout);
}

function getResponseInnerHTML(id) {
    // if id doesn't start with response-, add response-
    if (!id.startsWith('response-')) {
        id = 'response-' + id;
    }

    var response = document.getElementById(id);

    // copy response to clipboard
    var html = response.innerHTML;

    // clean up the response
    html = html.replace(/<zero-md><script type="text\/markdown">/g, '');
    html = html.replace(/<\/script><\/zero-md>/g, '');
    html = html.trim();

    return html;
}

function resubmitPrompt(id) {
    // get response innerHTML
    var html = getResponseInnerHTML(id);

    // set prompt value to response innerHTML
    prompt.value = html;
    message.value = prompt.value;

    // Scroll to indicator
    smoothScrollTo('loading');

    // Submit form
    onClickChange();
}

// find element by class and scroll to it, parameter is the class name
function smoothScrollTo(selector = "dialog", behavior = 'smooth', block = 'start') {
    switch (selector) {
        case "dialog":
            var opResponse = document.querySelector("#op-response");
            var opDialogs = opResponse.querySelectorAll('.op-dialog');
            var lastOpDialog = opDialogs[opDialogs.length - 1];
            var element = lastOpDialog ? lastOpDialog.id : null;

            // if there is no element with class of .op-dialog, scroll to the bottom
            if (element == null) {
                element = opResponse;
            } else {
                element = document.querySelector("#" + element);
            }
            element.scrollIntoView({ behavior: behavior, block: block });
            break;

        case 'bottom':
            element = document.querySelector("#op-response");
            block = 'end';
            break;

        case 'loading':
            element = document.querySelector("#indicator");
            break;

        default:
            element = document.querySelector(selector);
            break;
    }
    element.scrollIntoView({ behavior: behavior, block: block });
    console.log(element.id);
}

if (message) {

    // If the Enter key is pressed without Shift and the window width is large "enough"
    message.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 640) {
            e.preventDefault();
            if (!isBlank(message.value)) {
                submit.click();
            }
        };
    });

    // On submit click
    submit.addEventListener('click', function () {
        // Do not submit if the message is empty
        if (isBlank(message.value)) {
            return;
        }

        // Scroll to indicator
        smoothScrollTo('loading');

        // Submit form
        onClickChange();
    });

    // On #chat_log_id select change
    chat_log_id.addEventListener('change', function () {
        // Do not submit if the message is empty
        if (isBlank(chat_log_id.value)) {
            return;
        }

        // Submit form
        onClickChange();

        // Clear chat
        clearChat();
    });

    // On page load focus on the textarea #prompt
    window.onload = function () {
        message.focus();
    }
}
