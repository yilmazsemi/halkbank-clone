// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyC2q1Wf4of5HvAj1T0u46eYM5YyemtqSlc",
    authDomain: "halkbank-clone-fac8b.firebaseapp.com",
    projectId: "halkbank-clone-fac8b",
    storageBucket: "halkbank-clone-fac8b.appspot.com",
    messagingSenderId: "250586624305",
    appId: "1:250586624305:web:bb967cb8f671417d824010"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
export default app;
