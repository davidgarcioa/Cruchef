const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");

if (menuToggle && primaryNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = primaryNav.classList.toggle("open");
    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      primaryNav.classList.remove("open");
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const track = document.querySelector(".slides");
const slides = Array.from(document.querySelectorAll(".slide"));
const dots = Array.from(document.querySelectorAll(".dot"));
const nextButton = document.querySelector(".slider-arrow--right");
const prevButton = document.querySelector(".slider-arrow--left");
const sliderRoot = document.querySelector(".hero-slider");

let activeIndex = slides.length > 1 ? 1 : 0;
let autoplayTimer;
const lastIndex = Math.max(slides.length - 1, 0);

const renderSlide = (index) => {
  if (!track || slides.length === 0) {
    return;
  }

  activeIndex = Math.max(0, Math.min(index, lastIndex));
  track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;

  dots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === activeIndex;
    dot.classList.toggle("is-active", isActive);
    dot.setAttribute("aria-current", String(isActive));
  });

  if (prevButton) {
    prevButton.disabled = activeIndex === 0;
  }

  if (nextButton) {
    nextButton.disabled = activeIndex === lastIndex;
  }
};

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
  }
};

const startAutoplay = () => {
  stopAutoplay();

  if (slides.length > 1) {
    autoplayTimer = setInterval(() => {
      renderSlide(activeIndex === lastIndex ? 0 : activeIndex + 1);
    }, 6500);
  }
};

nextButton?.addEventListener("click", () => {
  renderSlide(activeIndex + 1);
  startAutoplay();
});

prevButton?.addEventListener("click", () => {
  renderSlide(activeIndex - 1);
  startAutoplay();
});

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    renderSlide(index);
    startAutoplay();
  });
});

sliderRoot?.addEventListener("mouseenter", stopAutoplay);
sliderRoot?.addEventListener("mouseleave", startAutoplay);

window.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAutoplay();
  } else {
    startAutoplay();
  }
});

renderSlide(activeIndex);
startAutoplay();

const authModal = document.querySelector(".auth-modal");
const authOpenButton = document.querySelector(".auth-button");
const authCloseButtons = Array.from(document.querySelectorAll("[data-auth-close]"));
const authTabs = Array.from(document.querySelectorAll(".auth-tab"));
const authTabSwitchButtons = Array.from(document.querySelectorAll("[data-auth-tab-switch]"));
const passwordToggleButtons = Array.from(document.querySelectorAll("[data-toggle-password]"));
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginFeedback = document.getElementById("login-feedback");
const registerFeedback = document.getElementById("register-feedback");
const forgotPasswordLink = document.getElementById("forgot-password-link");
let authCloseTimer;
const authPanels = {
  login: document.getElementById("login-panel"),
  register: document.getElementById("register-panel"),
};
const registerPasswordConfirmInput = document.getElementById("register-password-confirm");
const HOME_PAGE = "home.html";
const firebaseConfig = window.FIREBASE_CONFIG;
let firebaseAuth = null;
let firebaseDb = null;

if (
  window.firebase &&
  firebaseConfig &&
  typeof firebaseConfig.apiKey === "string" &&
  !firebaseConfig.apiKey.startsWith("TU_")
) {
  try {
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }
    firebaseAuth = window.firebase.auth();
    firebaseDb = window.firebase.firestore ? window.firebase.firestore() : null;

    firebaseAuth.onAuthStateChanged(async (user) => {
      if (!user) {
        return;
      }

      await user.reload();

      if (user.emailVerified && !window.location.pathname.endsWith("/home.html")) {
        window.location.href = HOME_PAGE;
      }
    });
  } catch (error) {
    console.error("Error inicializando Firebase:", error);
  }
}

registerPasswordConfirmInput?.addEventListener("input", () => {
  registerPasswordConfirmInput.setCustomValidity("");
});

passwordToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.togglePassword;
    const input = targetId ? document.getElementById(targetId) : null;

    if (!input) {
      return;
    }

    const isShowing = input.type === "text";
    input.type = isShowing ? "password" : "text";
    button.classList.toggle("is-visible", !isShowing);
    button.setAttribute("aria-pressed", String(!isShowing));
    button.setAttribute("aria-label", isShowing ? "Mostrar contrasena" : "Ocultar contrasena");
  });
});

const setFeedback = (target, message, type = "info") => {
  if (!target) {
    return;
  }

  target.textContent = message;
  target.classList.remove("is-error", "is-success", "is-info");
  target.classList.add(`is-${type}`);
};

const mapAuthError = (error) => {
  const errorCode = error?.code || "";

  switch (errorCode) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Correo o contrasena incorrectos.";
    case "auth/invalid-login-credentials":
      return "Credenciales invalidas. Verifica correo y contrasena.";
    case "auth/email-already-in-use":
      return "Ese correo ya esta registrado.";
    case "auth/invalid-email":
      return "El correo no es valido.";
    case "auth/weak-password":
      return "La contrasena debe tener al menos 6 caracteres.";
    case "auth/missing-password":
      return "Debes escribir la contrasena.";
    case "auth/operation-not-allowed":
      return "Email/Password no esta habilitado en Firebase Authentication.";
    case "auth/api-key-not-valid":
    case "auth/invalid-api-key":
      return "La API key de Firebase no es valida. Revisa firebase-config.js y copia la apiKey exacta desde Firebase Console.";
    case "auth/network-request-failed":
      return "No hay conexion a internet o la red esta bloqueando Firebase.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta de nuevo en unos minutos.";
    case "auth/user-disabled":
      return "Esta cuenta fue deshabilitada.";
    case "permission-denied":
      return "Firestore rechazo el guardado. Revisa las reglas de seguridad.";
    default:
      return `No se pudo completar la accion. ${error?.message || "Intenta nuevamente."}`;
  }
};

const withLoadingState = (form, isLoading) => {
  if (!form) {
    return;
  }

  form.querySelectorAll("input, button").forEach((element) => {
    element.disabled = isLoading;
  });
};

const upsertUserProfile = async (user, fullName = "") => {
  if (!firebaseDb || !user) {
    return;
  }

  const userRef = firebaseDb.collection("users").doc(user.uid);
  const snapshot = await userRef.get();
  const now = window.firebase.firestore.FieldValue.serverTimestamp();

  const payload = {
    uid: user.uid,
    email: user.email || "",
    fullName: fullName || user.displayName || "",
    emailVerified: Boolean(user.emailVerified),
    lastLoginAt: now,
    provider: "password",
    updatedAt: now,
  };

  if (!snapshot.exists) {
    payload.createdAt = now;
  }

  await userRef.set(payload, { merge: true });
};

const setAuthTab = (tabName) => {
  authTabs.forEach((tab) => {
    const isActive = tab.dataset.authTab === tabName;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  Object.entries(authPanels).forEach(([name, panel]) => {
    if (!panel) {
      return;
    }

    const isActive = name === tabName;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
};

const openAuthModal = (tabName = "login") => {
  if (!authModal) {
    return;
  }

  if (authCloseTimer) {
    clearTimeout(authCloseTimer);
  }

  setAuthTab(tabName);
  authModal.hidden = false;
  requestAnimationFrame(() => {
    authModal.classList.add("auth-modal--open");
  });
  document.body.style.overflow = "hidden";
};

const closeAuthModal = () => {
  if (!authModal) {
    return;
  }

  authModal.classList.remove("auth-modal--open");

  authCloseTimer = setTimeout(() => {
    authModal.hidden = true;
  }, 220);

  document.body.style.overflow = "";
};

if (authModal && authOpenButton) {
  authOpenButton.addEventListener("click", () => openAuthModal("login"));

  authCloseButtons.forEach((button) => {
    button.addEventListener("click", closeAuthModal);
  });

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setAuthTab(tab.dataset.authTab || "login");
    });
  });

  authTabSwitchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setAuthTab(button.dataset.authTabSwitch || "login");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !authModal.hidden) {
      closeAuthModal();
    }
  });
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setFeedback(loginFeedback, "");

  if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
  }

  if (!firebaseAuth) {
    setFeedback(loginFeedback, "Firebase no esta configurado aun. Completa firebase-config.js.", "error");
    return;
  }

  const email = document.getElementById("login-email")?.value?.trim() || "";
  const password = document.getElementById("login-password")?.value || "";

  try {
    withLoadingState(loginForm, true);
    const credentials = await firebaseAuth.signInWithEmailAndPassword(email, password);
    const user = credentials.user;
    await user.reload();

    if (!user.emailVerified) {
      await user.sendEmailVerification();
      await firebaseAuth.signOut();
      setFeedback(
        loginFeedback,
        "Tu correo aun no esta verificado. Te reenviamos un correo de verificacion. Revisa bandeja y spam.",
        "error"
      );
      return;
    }

    await upsertUserProfile(user);
    setFeedback(loginFeedback, "Inicio de sesion exitoso. Redirigiendo...", "success");
    window.location.href = HOME_PAGE;
  } catch (error) {
    setFeedback(loginFeedback, mapAuthError(error), "error");
  } finally {
    withLoadingState(loginForm, false);
  }
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setFeedback(registerFeedback, "");

  if (!registerForm.checkValidity()) {
    registerForm.reportValidity();
    return;
  }

  const passwordInput = document.getElementById("register-password");
  const passwordConfirmInput = document.getElementById("register-password-confirm");
  const nameInput = document.getElementById("register-name");
  const emailInput = document.getElementById("register-email");

  const password = passwordInput?.value || "";
  const passwordConfirm = passwordConfirmInput?.value || "";
  const name = nameInput?.value?.trim() || "";
  const email = emailInput?.value?.trim() || "";

  if (password !== passwordConfirm) {
    passwordConfirmInput?.setCustomValidity("Las contrasenas no coinciden.");
    registerForm.reportValidity();
    return;
  }

  passwordConfirmInput?.setCustomValidity("");

  if (!firebaseAuth) {
    setFeedback(registerFeedback, "Firebase no esta configurado aun. Completa firebase-config.js.", "error");
    return;
  }

  try {
    withLoadingState(registerForm, true);
    const credentials = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    const user = credentials.user;

    if (user && name) {
      await user.updateProfile({ displayName: name });
    }

    if (user) {
      await upsertUserProfile(user, name);
      await user.sendEmailVerification();
      await firebaseAuth.signOut();
    }

    setFeedback(
      registerFeedback,
      "Cuenta creada. Te enviamos un correo de verificacion. Verificalo antes de iniciar sesion.",
      "success"
    );
    registerForm.reset();
    setAuthTab("login");
    setFeedback(loginFeedback, "Primero verifica tu correo y luego inicia sesion.", "info");
  } catch (error) {
    setFeedback(registerFeedback, mapAuthError(error), "error");
  } finally {
    withLoadingState(registerForm, false);
  }
});

forgotPasswordLink?.addEventListener("click", async (event) => {
  event.preventDefault();
  setFeedback(loginFeedback, "");

  const email = document.getElementById("login-email")?.value?.trim() || "";

  if (!email) {
    setFeedback(loginFeedback, "Ingresa tu correo y luego haz clic en 'Olvide mi contrasena'.", "info");
    return;
  }

  if (!firebaseAuth) {
    setFeedback(loginFeedback, "Firebase no esta configurado aun. Completa firebase-config.js.", "error");
    return;
  }

  try {
    await firebaseAuth.sendPasswordResetEmail(email);
    setFeedback(loginFeedback, "Te enviamos un enlace para restablecer tu contrasena.", "success");
  } catch (error) {
    setFeedback(loginFeedback, mapAuthError(error), "error");
  }
});

