// when importing this file in the HTML make sure to set it to be type="module"
// when adding the various login modes, the order you add them is the order they appear within the div
// last edited 24/02/2022
// @ts-ignore
import { JTML } from "https://joshprojects.site/JTML_Module.js";
// @ts-ignore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.3/firebase-app.js";
// @ts-ignore
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.3/firebase-auth.js";
// @ts-ignore
import { CSSManipulator } from "https://joshprojects.site/modules/CSSManipulator.js";
class AuthHandler {
    constructor(firebaseConfig, container, loginModes) {
        this.loginModes = [];
        this.errorFields = [];
        this.loggingIn = (value) => { return true; };
        this.loggingOut = (value) => { return true; };
        // console.time("authTime")
        this.app = initializeApp(firebaseConfig);
        // note that these fire once the page loads
        onAuthStateChanged(getAuth(), (user) => {
            // console.log(user);
            this.resetLogin();
            if (user) {
                // console.timeEnd("authTime")
                console.log("user just logged in");
                this.loggingIn(this);
            }
            else {
                this.loggingOut(this);
            }
        });
        if (container) {
            if (loginModes) {
                this.loginModes = loginModes;
            }
            this.container = new JTML(container)
                .css({
                'display': 'grid',
                'justify-items': 'center'
            });
            this.configAuthForm();
        }
        let css = new CSSManipulator('AuthHandler');
        css.add(`
		#authForm > input, #signUpContainer > input {
			margin: 10px 0px 20px;
			width: 400px;
			max-width: 90vmin;
		}

		#authForm > label, #signUpContainer > label {
			font-size: clamp(14px,5vmin,17px);
		}

		#buttonHolder > button {
			width: 100%;
			padding: clamp(10px,5vmin,25px);
			font-size: clamp(14px,5vmin,17px);
		}`);
        // let style = document.createElement('style');
        // style.appendChild(document.createTextNode(cssString));
        // document.getElementsByTagName('head')[0].appendChild(style);
    }
    get user() {
        return getAuth().currentUser;
    }
    async getToken() {
        try {
            // they need to be logged in in order to have a token
            await this.whenLoggedIn();
            return this.user.getIdToken();
        }
        catch (error) {
            // whenLoggedIn() returns an error if the login process is taking too long
            throw error;
        }
    }
    // it takes some time to login so this gives a way to wait until they are logged in
    // there is a timeout if this has been running for too long so that the user can be notified that something is wrong (e.g. they're not logged in when they need to be)
    // based on https://stackoverflow.com/questions/22125865/wait-until-flag-true
    async whenLoggedIn(timeoutDurationInMS = 30000) {
        return new Promise((resolve) => {
            let startTime = new Date();
            let interval = setInterval(() => {
                // throw an error if login is taking longer than timeoutDurationInMS because otherwise 
                // if they're not logged in the code will just hang with no indication of why it's stopped
                if (new Date().getTime() - startTime.getTime() > timeoutDurationInMS) {
                    clearInterval(interval);
                    throw new Error(`it is taking too long to log in`);
                }
                if (!getAuth().currentUser) {
                    return;
                }
                clearInterval(interval);
                resolve(true);
            }, 100);
        });
    }
    resetLogin() {
        if (this.authForm) {
            this.authForm.ref.signUpEmail.value = '';
            this.authForm.ref.signUpPassword.value = '';
            this.authForm.ref.passwordAgain.value = '';
            this.authForm.ref.nickname.value = '';
            document.querySelector(`#showLogin`).style.display = 'block';
            document.querySelector(`#showSignUp`).style.display = 'block';
            this.authForm.css({ 'display': 'none' });
            this.resetErrorFields();
        }
    }
    configAuthForm() {
        this.buttonHolder = new JTML("div")
            .set('id', 'buttonHolder')
            .css({
            'display': 'grid',
            'justify-items': 'center',
            'gap': 'clamp(30px,10vmin,100px)'
        })
            .appendTo(this.container);
        this.authForm = new JTML("form")
            .set('name', 'authForm')
            .set('id', 'authForm')
            .css({
            'display': 'none',
            'justify-items': 'center',
            'grid-template-columns': '1fr',
            'row-gap': '0px',
            'width': '100%',
            'margin': '15vmin 0px 40vmin 0px'
        })
            .appendTo(this.container);
        // note here that the order of the elements in the array matters
        this.loginModes.forEach((loginMode) => {
            switch (loginMode) {
                case 'google':
                    this.configGoogleLogin();
                    break;
                case 'email':
                    this.configEmailLogin();
                    break;
                default:
                    break;
            }
        });
    }
    addOr(mode) {
        if (this.loginModes[0] != mode) {
            let or = new JTML("span")
                .class('or')
                .html("OR")
                .appendTo(this.buttonHolder);
        }
    }
    resetErrorFields() {
        this.errorFields.forEach((errorField) => {
            errorField.style = 'display: none; max-height:0px; margin-bottom: 0px;';
        });
    }
    configEmailLogin() {
        this.addOr('email');
        let showSignUp = new JTML("button")
            .set('id', 'showSignUp')
            .html('new user <strong>sign-up</strong>')
            .appendTo(this.buttonHolder);
        let showLogin = new JTML("button")
            .set('id', 'showLogin')
            .html('returning user <strong>login</strong>')
            .appendTo(this.buttonHolder);
        let signUpEmailLabel = new JTML("label")
            .html('email')
            .set('for', 'signUpEmail')
            .appendTo(this.authForm);
        let signUpEmail = new JTML("input")
            .set('type', 'email')
            .set('name', 'signUpEmail')
            .set('id', 'signUpEmail')
            .set('required', 'true')
            .set('autoComplete', 'email')
            .appendTo(this.authForm);
        let emailError = new JTML("div")
            .set('id', 'emailError')
            .appendTo(this.authForm);
        let signUpPasswordLabel = new JTML("label")
            .html('password')
            .set('for', 'signUpPassword')
            .appendTo(this.authForm);
        let signUpPassword = new JTML("input")
            .set('type', 'password')
            .set('name', 'signUpPassword')
            .set('id', 'signUpPassword')
            .set('required', 'true')
            .set('autoComplete', 'current-password')
            .appendTo(this.authForm);
        let passwordError = new JTML("div")
            .set('id', 'passwordError')
            .appendTo(this.authForm);
        let signUpContainer = new JTML("div")
            .set('id', 'signUpContainer')
            .css({
            'display': 'grid',
            'justify-items': 'center',
            'width': '100%'
        })
            .appendTo(this.authForm);
        let passwordAgainLabel = new JTML("label")
            .html('repeat password')
            .set('for', 'passwordAgain')
            .appendTo(signUpContainer);
        let passwordAgain = new JTML("input")
            .set('type', 'password')
            .set('name', 'passwordAgain')
            .set('id', 'passwordAgain')
            .set('autoComplete', 'new-password')
            .appendTo(signUpContainer);
        let againError = new JTML("div")
            .set('id', 'againError')
            .appendTo(signUpContainer);
        let nicknameLabel = new JTML("label")
            .html('display name')
            .set('for', 'nickname')
            .appendTo(signUpContainer);
        let nickname = new JTML("input")
            .set('type', 'text')
            .set('name', 'nickname')
            .set('id', 'nickname')
            .set('autoComplete', 'username')
            .appendTo(signUpContainer);
        let authSubmit = new JTML("input")
            .set('type', 'submit')
            .appendTo(this.authForm);
        this.errorFields.push(emailError);
        this.errorFields.push(passwordError);
        this.errorFields.push(againError);
        showLogin.addEventListener('click', () => {
            this.container.css({
                'align-content': 'start',
                'margin-top': '25vmin'
            });
            this.authForm.css({ 'display': 'grid' });
            signUpContainer.css({ 'display': 'none' });
            showLogin.css({ 'display': 'none' });
            showSignUp.css({ 'display': 'block' });
            authSubmit.setValue('login');
            this.authForm.ref.scrollIntoView(true, { behavior: "smooth", block: 'start' });
        });
        showSignUp.addEventListener('click', () => {
            this.container.css({
                'align-content': 'start',
                'margin-top': '25vmin'
            });
            this.authForm.css({ 'display': 'grid' });
            signUpContainer.css({ 'display': 'grid' });
            showLogin.css({ 'display': 'block' });
            showSignUp.css({ 'display': 'none' });
            authSubmit.setValue('sign up');
            this.authForm.ref.scrollIntoView(true, { behavior: "smooth", block: 'start' });
        });
        this.authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (authSubmit.value == 'sign up') {
                if (signUpPassword.value == passwordAgain.value) {
                    createUserWithEmailAndPassword(getAuth(), signUpEmail.value, signUpPassword.value)
                        .then((cred) => {
                        // don't need to run this.loggingIn here, because the auth state listener will fire
                    })
                        .catch((err) => {
                        this.resetErrorFields();
                        console.log(err);
                        emailError.css({ 'display': 'inline-block' })
                            .html(`<p>${err}</p>`);
                        authSubmit.setValue("sign up");
                    });
                    authSubmit.setValue("loading...");
                }
                else {
                    this.resetErrorFields();
                    if (passwordAgain.value.length == 0) {
                        console.log("no password added");
                        againError.css({ 'display': 'inline-block' })
                            .html(`<p>Error: Repeat password field empty</p>`);
                    }
                    else {
                        console.log("the two passwords don't match");
                        againError.css({ 'display': 'inline-block' })
                            .html(`<p>Error: The two passwords don't match</p>`);
                    }
                }
            }
            else {
                signInWithEmailAndPassword(getAuth(), this.authForm.ref.signUpEmail.value, this.authForm.ref.signUpPassword.value)
                    .then((cred) => {
                    // don't need to run this.loggingIn here, because the auth state listener will fire
                })
                    .catch((err) => {
                    this.resetErrorFields();
                    console.log(err);
                    if (err == "Error: The email address is badly formatted.") {
                        emailError.css({ 'display': 'inline-block' })
                            .html(`<p>${err}</p>`);
                    }
                    else {
                        passwordError.css({ 'display': 'inline-block' })
                            .html(`<p>${err}</p>`);
                    }
                    authSubmit.setValue("login");
                });
                authSubmit.setValue("loading...");
            }
        });
    }
    configGoogleLogin() {
        this.addOr('google');
        let googleLoginButton = new JTML("button")
            .set('id', 'googleLoginButton')
            .set('name', 'googleLoginButton')
            .html(`<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 48 48" class="abcRioButtonSvg"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg><p style="margin: 0px">Sign in with <strong>Google</strong></p>`)
            .on('click', this.doGoogleLogin)
            .css({
            'display': 'grid',
            'grid-auto-flow': 'column',
            'gap': '10px',
            'place-items': 'center'
        })
            .appendTo(this.buttonHolder);
    }
    doGoogleLogin() {
        signInWithPopup(getAuth(), new GoogleAuthProvider()).then((result) => {
            // don't need to run this.loggingIn here, because the auth state listener will fire
        }).catch(function (error) {
            console.log(error);
            console.log("double check that you've got google auth configured as a valid auth method");
            console.log("or it could be that you haven't configured this domain to be allowed with google auth in the firebase console");
        });
    }
    logout() {
        signOut(getAuth()).then(() => {
            // don't need to run this.loggingOut here, because the auth state listener will fire
        });
    }
    onceLoggedOut(callbackFunction) {
        this.loggingOut = callbackFunction;
    }
    onceLoggedIn(callbackFunction) {
        this.loggingIn = callbackFunction;
    }
}
export { AuthHandler };
