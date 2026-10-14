const state = {
  token: localStorage.getItem("equinox_token") || "",
  data: null,
  activeSection: "command-center",
  refreshTimer: null,
  scanner: null,
  loadingBootstrap: false,
  paymentLocked: false,
};

const sectionMeta = {
  "command-center": {
    title: "Command Center",
    subtitle: "Payment readiness, trust signals, ledger activity, and operational visibility across the platform.",
  },
  "wallet-hub": {
    title: "Wallet & Transfer",
    subtitle: "Use wallet ID or QR flows, choose an active card reference, and monitor transfer-side audit details.",
  },
  "cards-payments": {
    title: "Cards & Payments",
    subtitle: "Issue virtual cards after verified checkout, manage freeze controls, and review the full payment order timeline.",
  },
  "skill-market": {
    title: "Skill Market",
    subtitle: "Publish services, open marketplace contracts, settle them atomically, and build trust through reviews.",
  },
  "social-pool": {
    title: "Community Pools",
    subtitle: "Create verified impact campaigns, contribute Eq, and demonstrate trigger-driven funding totals.",
  },
  "citizen-directory": {
    title: "Citizen Directory",
    subtitle: "Discover peers, inspect trust levels, and prefill secure wallet transfers in one click.",
  },
  "query-lab": {
    title: "SQL Demonstrator",
    subtitle: "Run preset joins or your own read-only queries against live MySQL data for a clean demonstration flow.",
  },
};

const staticPages = {
  about: {
    title: "About Equinox",
    body: `
      <h4>Beyond Money</h4>
      <p>Equinox is a reciprocity finance platform where community contribution is tracked as Equinox Credits (Eq) inside a MySQL-backed payment and trust ecosystem.</p>
      <p>This build combines wallet activation, virtual card issuance, QR-based transfers, community funding, service contracts, trust scoring, and live SQL views inside one professional interface.</p>
      <p>The aim is to help your DBMS project feel product-grade while still keeping the data model, procedures, joins, and operational flows easy to explain during demonstration.</p>
    `,
  },
  privacy: {
    title: "Privacy Policy",
    body: `
      <h4>Local Project Privacy Scope</h4>
      <p>This project stores profile, wallet, card, contract, transaction, payment order, review, and login audit data within the local MySQL schema <code>equinox_dbms</code>.</p>
      <p>Card CVV values are hashed before storage. Only the one-time issuance response reveals the generated CVV in the user interface.</p>
      <p>Location and device details are retained strictly for demonstration of audit, fraud-awareness, and database logging concepts inside the local evaluation environment.</p>
    `,
  },
  terms: {
    title: "Terms of Use",
    body: `
      <h4>Demo Usage Terms</h4>
      <p>Equinox is an academic product demonstration. Eq is a project currency and not legal tender.</p>
      <p>Wallet activation and card issuance require verified payment success in the application flow, while the ledger, cards, notifications, and trust records remain backed by real MySQL tables and procedures.</p>
      <p>The SQL Demonstrator is limited to safe read-only statements so the database state stays intact during project presentations.</p>
    `,
  },
  support: {
    title: "Support",
    body: `
      <h4>Environment Checks</h4>
      <p>If a payment or dashboard flow is not responding, confirm that MySQL is running, the schema has been imported successfully, and your <code>.env</code> file contains the correct database password and Razorpay test credentials.</p>
      <p>If Razorpay checkout does not open, check internet connectivity in the browser and verify that the Razorpay test key and secret are set in the backend environment.</p>
      <p>For a reliable live demo: register two citizens, activate one wallet, issue a card, send a QR payment, and then validate the database state using the SQL Demonstrator presets.</p>
    `,
  },
};

const ui = {
  authScreen: document.getElementById("auth-screen"),
  appShell: document.getElementById("app-shell"),
  authMessage: document.getElementById("auth-message"),
  registerForm: document.getElementById("register-form"),
  loginForm: document.getElementById("login-form"),
  sidebar: document.getElementById("sidebar"),
  topbarTitle: document.getElementById("topbar-section-title"),
  topbarSubtitle: document.getElementById("topbar-section-subtitle"),
  profileAvatar: document.getElementById("profile-avatar"),
  sidebarUserName: document.getElementById("sidebar-user-name"),
  sidebarTrustLabel: document.getElementById("sidebar-trust-label"),
  availableBalance: document.getElementById("available-balance"),
  walletStatusPill: document.getElementById("wallet-status-pill"),
  kycStatusPill: document.getElementById("kyc-status-pill"),
  checkoutStatusPill: document.getElementById("checkout-status-pill"),
  walletReadinessCopy: document.getElementById("wallet-readiness-copy"),
  walletReadinessList: document.getElementById("wallet-readiness-list"),
  heroPrimaryAction: document.getElementById("hero-primary-action"),
  heroSecondaryAction: document.getElementById("hero-secondary-action"),
  trustRing: document.getElementById("trust-ring"),
  trustScoreValue: document.getElementById("trust-score-value"),
  trustScoreTier: document.getElementById("trust-score-tier"),
  trustVolumeLabel: document.getElementById("trust-volume-label"),
  trustRepLabel: document.getElementById("trust-rep-label"),
  trustAgeLabel: document.getElementById("trust-age-label"),
  totalSent: document.getElementById("stat-total-sent"),
  totalReceived: document.getElementById("stat-total-received"),
  fiatPaid: document.getElementById("stat-fiat-paid"),
  cardCount: document.getElementById("stat-card-count"),
  recentTransactions: document.getElementById("recent-transactions"),
  commandPaymentFeed: document.getElementById("command-payment-feed"),
  paymentCountPill: document.getElementById("payment-count-pill"),
  notificationFeed: document.getElementById("notification-feed"),
  notificationCountPill: document.getElementById("notification-count-pill"),
  trustFeed: document.getElementById("trust-feed"),
  securityFeed: document.getElementById("security-feed"),
  walletIdFull: document.getElementById("wallet-id-full"),
  walletQrPayload: document.getElementById("wallet-qr-payload"),
  receiverWalletInput: document.getElementById("receiver-wallet-input"),
  paymentNoteInput: document.getElementById("payment-note-input"),
  paymentCardSelect: document.getElementById("payment-card-select"),
  walletCardPreview: document.getElementById("wallet-card-preview"),
  walletTransactionAudit: document.getElementById("wallet-transaction-audit"),
  cardsGrid: document.getElementById("cards-grid"),
  paymentsHistory: document.getElementById("payments-history"),
  kycName: document.getElementById("kyc-name"),
  kycEmail: document.getElementById("kyc-email"),
  kycPhone: document.getElementById("kyc-phone"),
  kycCity: document.getElementById("kyc-city"),
  kycStatusText: document.getElementById("kyc-status-text"),
  kycWalletStatus: document.getElementById("kyc-wallet-status"),
  cardProgramNote: document.getElementById("card-program-note"),
  skillsGrid: document.getElementById("skills-grid"),
  contractsGrid: document.getElementById("contracts-grid"),
  poolsGrid: document.getElementById("pools-grid"),
  directoryGrid: document.getElementById("directory-grid"),
  queryPresetList: document.getElementById("query-preset-list"),
  queryMeta: document.getElementById("query-meta"),
  querySqlOutput: document.getElementById("query-sql-output"),
  queryTableWrap: document.getElementById("query-table-wrap"),
  qrRender: document.getElementById("qr-render"),
  qrWalletLabel: document.getElementById("qr-wallet-label"),
  qrScanner: document.getElementById("qr-scanner"),
  pageModalTitle: document.getElementById("page-modal-title"),
  pageModalBody: document.getElementById("page-modal-body"),
  contractForm: document.getElementById("contract-form"),
  contractSubtitle: document.getElementById("contract-modal-subtitle"),
  contributeForm: document.getElementById("contribute-form"),
  contributeSubtitle: document.getElementById("contribute-modal-subtitle"),
  reviewForm: document.getElementById("review-form"),
  reviewSubtitle: document.getElementById("review-modal-subtitle"),
  issuedCardLabel: document.getElementById("issued-card-label"),
  issuedCardNumber: document.getElementById("issued-card-number"),
  issuedCardExpiry: document.getElementById("issued-card-expiry"),
  issuedCardCvv: document.getElementById("issued-card-cvv"),
  toastStack: document.getElementById("toast-stack"),
};

document.querySelectorAll("[data-auth-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-auth-tab]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const tab = button.dataset.authTab;
    ui.registerForm.classList.toggle("hidden", tab !== "register");
    ui.loginForm.classList.toggle("hidden", tab !== "login");
    ui.authMessage.textContent = "";
  });
});

ui.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(ui.registerForm).entries());
  const response = await api("/api/register", "POST", payload);
  ui.authMessage.textContent = response.success ? response.message : response.error || "Registration failed.";

  if (!response.success) {
    showToast("Registration failed", response.error || "Please review the submitted details and try again.", "error");
    return;
  }

  ui.registerForm.reset();
  showToast("Citizen profile created", response.message || "You can now sign in to continue.", "success");
});

ui.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(ui.loginForm).entries());
  const response = await api("/api/login", "POST", payload);

  if (!response.success) {
    ui.authMessage.textContent = response.error || "Login failed.";
    showToast("Login failed", response.error || "Check your email and password and try again.", "error");
    return;
  }

  state.token = response.token;
  localStorage.setItem("equinox_token", response.token);
  ui.authMessage.textContent = "Login successful.";
  enterApp();
  await loadDashboard();
  showToast("Welcome back", "You are now connected to the Equinox command center.", "success");
});

document.getElementById("payment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target).entries());
  payload.amount = Number(payload.amount);
  Object.assign(payload, await getCoords());
  const response = await api("/api/wallet/transfer", "POST", payload, true);

  if (!response.success) {
    showToast("Transfer failed", response.error || "The payment could not be completed.", "error");
    return;
  }

  event.target.reset();
  ui.paymentCardSelect.value = "";
  await loadDashboard({ silent: true });
  showToast("Transfer completed", response.message || "The Eq transfer was committed successfully.", "success");
});

document.getElementById("card-order-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target).entries());
  await beginPaymentFlow("CARD_ISSUANCE", {
    card_name: (payload.card_name || "").trim() || "Primary",
  });
});

document.getElementById("upi-payment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target).entries());
  payload.upi_amount = Number(payload.upi_amount);

  const response = await api("/api/payments/upi", "POST", payload, true);

  if (!response.success) {
    showToast("UPI Payment failed", response.error || "The UPI payment could not be processed.", "error");
    return;
  }

  event.target.reset();
  showToast("UPI Payment initiated", response.message || "Payment request sent. Confirm in your UPI app.", "success");
  await loadDashboard({ silent: true });
});

document.getElementById("skill-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target).entries());
  payload.rate_per_hour = Number(payload.rate_per_hour);
  const response = await api("/api/skills", "POST", payload, true);

  if (!response.success) {
    showToast("Listing failed", response.error || "The skill listing could not be published.", "error");
    return;
  }

  event.target.reset();
  await loadDashboard({ silent: true });
  showToast("Listing published", response.message || "Your marketplace listing is now live.", "success");
});

document.getElementById("pool-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target).entries());
  payload.target_amount = Number(payload.target_amount);
  if (payload.deadline) {
    payload.deadline = payload.deadline.replace("T", " ") + ":00";
  }
  const response = await api("/api/pools", "POST", payload, true);

  if (!response.success) {
    showToast("Pool creation failed", response.error || "The community pool could not be created.", "error");
    return;
  }

  event.target.reset();
  await loadDashboard({ silent: true });
  showToast("Pool created", response.message || "Your community pool is now available for contributions.", "success");
});

document.getElementById("custom-query-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target).entries());
  await runQuery(payload.sql || "", "");
});

ui.contractForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(ui.contractForm).entries());
  payload.hours = Number(payload.hours);
  const response = await api("/api/contracts", "POST", payload, true);

  if (!response.success) {
    showToast("Contract creation failed", response.error || "The service contract could not be opened.", "error");
    return;
  }

  closeModal("contract-modal");
  ui.contractForm.reset();
  await loadDashboard({ silent: true });
  showToast("Contract created", response.message || "The contract is now available for settlement.", "success");
});

ui.contributeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(ui.contributeForm).entries());
  payload.amount = Number(payload.amount);
  const response = await api("/api/pools/contribute", "POST", payload, true);

  if (!response.success) {
    showToast("Contribution failed", response.error || "The pool contribution could not be processed.", "error");
    return;
  }

  closeModal("contribute-modal");
  ui.contributeForm.reset();
  await loadDashboard({ silent: true });
  showToast("Contribution completed", response.message || "The pool has been updated successfully.", "success");
});

ui.reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(ui.reviewForm).entries());
  payload.rating = Number(payload.rating);
  const response = await api("/api/reviews", "POST", payload, true);

  if (!response.success) {
    showToast("Review submission failed", response.error || "The review could not be saved.", "error");
    return;
  }

  closeModal("review-modal");
  ui.reviewForm.reset();
  await loadDashboard({ silent: true });
  showToast("Review submitted", response.message || "Trust-related records have been updated.", "success");
});

document.getElementById("manual-scan-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target).entries());
  processScannedPayload(payload.manual_payload || "");
});

ui.heroPrimaryAction.addEventListener("click", async () => {
  const profile = state.data?.profile;
  if (!profile) {
    return;
  }

  if (profile.status !== "ACTIVE") {
    await beginPaymentFlow("WALLET_ACTIVATION");
    return;
  }

  switchSection("cards-payments");
  const input = document.querySelector("#card-order-form input[name='card_name']");
  if (input) {
    input.focus();
  }
});

ui.heroSecondaryAction.addEventListener("click", () => {
  const mode = ui.heroSecondaryAction.dataset.mode || "wallet";
  if (mode === "payments") {
    switchSection("cards-payments");
    return;
  }
  switchSection("wallet-hub");
});

document.getElementById("show-my-qr-top").addEventListener("click", openQrModal);
document.getElementById("scan-qr-top").addEventListener("click", openScanModal);
document.getElementById("wallet-show-qr-btn").addEventListener("click", openQrModal);
document.getElementById("wallet-scan-qr-btn").addEventListener("click", openScanModal);
document.getElementById("copy-wallet-id-btn").addEventListener("click", () => copyText(ui.walletIdFull.textContent, "Wallet ID copied"));
document.getElementById("copy-qr-payload-btn").addEventListener("click", () => copyText(ui.qrWalletLabel.textContent, "QR payload copied"));
document.getElementById("jump-wallet-btn").addEventListener("click", () => switchSection("wallet-hub"));
document.getElementById("nav-new-transfer").addEventListener("click", () => {
  switchSection("wallet-hub");
  ui.receiverWalletInput.focus();
});
document.getElementById("logout-btn").addEventListener("click", logout);
document.getElementById("mobile-menu-toggle").addEventListener("click", () => {
  ui.sidebar.classList.toggle("open");
});

document.body.addEventListener("click", async (event) => {
  const modalElement = event.target.classList.contains("modal") ? event.target : null;
  if (modalElement) {
    closeModal(modalElement.id);
    return;
  }

  const closeButton = event.target.closest("[data-close-modal]");
  if (closeButton) {
    closeModal(closeButton.dataset.closeModal);
    return;
  }

  const staticPageButton = event.target.closest("[data-static-page]");
  if (staticPageButton) {
    openStaticPage(staticPageButton.dataset.staticPage);
    return;
  }

  const navButton = event.target.closest("[data-section-target]");
  if (navButton) {
    switchSection(navButton.dataset.sectionTarget);
    if (window.innerWidth <= 1024) {
      ui.sidebar.classList.remove("open");
    }
    return;
  }

  const shortcutButton = event.target.closest("[data-section-shortcut]");
  if (shortcutButton) {
    switchSection(shortcutButton.dataset.sectionShortcut);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;

  if (action === "toggle-card-freeze") {
    const response = await api("/api/cards/freeze", "POST", { card_id: actionButton.dataset.cardId }, true);
    showToast(
      response.success ? "Card updated" : "Card update failed",
      response.success ? response.message || "The card state changed successfully." : response.error || "The card state could not be updated.",
      response.success ? "success" : "error"
    );
    if (response.success) {
      await loadDashboard({ silent: true });
    }
    return;
  }

  if (action === "prefill-transfer") {
    prefillTransfer(actionButton.dataset.walletId, actionButton.dataset.name);
    return;
  }

  if (action === "open-contract") {
    openContractModal(actionButton.dataset.skillId, actionButton.dataset.skillName, actionButton.dataset.rate);
    return;
  }

  if (action === "open-contribute") {
    openContributeModal(actionButton.dataset.poolId, actionButton.dataset.poolTitle);
    return;
  }

  if (action === "settle-contract") {
    const response = await api("/api/contracts/settle", "POST", { contract_id: actionButton.dataset.contractId }, true);
    showToast(
      response.success ? "Contract settled" : "Settlement failed",
      response.success ? response.message || "The contract settlement completed successfully." : response.error || "The contract could not be settled.",
      response.success ? "success" : "error"
    );
    if (response.success) {
      await loadDashboard({ silent: true });
    }
    return;
  }

  if (action === "open-review") {
    openReviewModal(actionButton.dataset.contractId, actionButton.dataset.subjectId, actionButton.dataset.subjectName);
    return;
  }

  if (action === "run-preset-query") {
    await runQuery("", actionButton.dataset.presetId);
  }
});

function enterApp() {
  ui.authScreen.classList.add("hidden");
  ui.appShell.classList.remove("hidden");
  switchSection(state.activeSection);
}

function exitApp() {
  ui.appShell.classList.add("hidden");
  ui.authScreen.classList.remove("hidden");
}

function logout() {
  stopScanner();
  clearInterval(state.refreshTimer);
  state.refreshTimer = null;
  state.data = null;
  state.activeSection = "command-center";
  state.token = "";
  state.paymentLocked = false;
  localStorage.removeItem("equinox_token");
  exitApp();
}

async function loadDashboard(options = {}) {
  if (!state.token || state.loadingBootstrap) {
    return;
  }

  state.loadingBootstrap = true;
  const response = await api("/api/bootstrap", "GET", null, true);
  state.loadingBootstrap = false;

  if (!response.success) {
    if (!options.silent) {
      showToast("Dashboard unavailable", response.error || "The dashboard could not be loaded.", "error");
    }
    logout();
    return;
  }

  state.data = response;
  renderAll();
  startAutoRefresh();
}

function renderAll() {
  if (!state.data) {
    return;
  }

  renderProfile(state.data.profile, state.data.insights, state.data.payment_config);
  renderTransactions(state.data.transactions || []);
  renderNotifications(state.data.notifications || []);
  renderTrustHistory(state.data.trust_history || []);
  renderSecurity(state.data.login_history || []);
  renderCards(state.data.cards || []);
  renderPayments(state.data.payments || []);
  renderSkills(state.data.skills || []);
  renderContracts(state.data.contracts || []);
  renderPools(state.data.pools || []);
  renderDirectory(state.data.directory || []);
  renderQueryPresets(state.data.query_presets || []);
  switchSection(state.activeSection);
}

function renderProfile(profile, insights, paymentConfig) {
  const trustScore = Number(profile.trust_score || 0);
  const accountAgeDays = Number(insights.account_age_days || 0);
  const trustDegrees = Math.max(10, Math.min(360, trustScore * 3.6));
  const unreadCount = (state.data.notifications || []).filter((item) => Number(item.is_read) === 0).length;
  const checkoutEnabled = Boolean(paymentConfig?.checkout_enabled);
  const cardCount = Number(insights.card_count || 0);

  ui.profileAvatar.textContent = initials(profile.full_name);
  ui.sidebarUserName.textContent = profile.full_name || "Citizen";
  ui.sidebarTrustLabel.textContent = `Trust Level: ${trustTier(trustScore)}`;
  ui.availableBalance.textContent = formatEq(profile.balance);
  ui.walletStatusPill.textContent = profile.status || "DORMANT";
  ui.walletStatusPill.className = `pill ${profile.status === "ACTIVE" ? "cyan" : "muted"}`;
  ui.kycStatusPill.textContent = `KYC ${profile.kyc_status || "PENDING"}`;
  ui.kycStatusPill.className = `pill ${profile.kyc_status === "VERIFIED" ? "cyan" : "muted"}`;
  ui.checkoutStatusPill.textContent = checkoutEnabled ? "Checkout Ready" : "Checkout Offline";
  ui.checkoutStatusPill.className = `pill ${checkoutEnabled ? "cyan" : "muted"}`;
  ui.trustRing.style.background = `conic-gradient(var(--cyan) ${trustDegrees}deg, rgba(255, 255, 255, 0.08) ${trustDegrees}deg)`;
  ui.trustScoreValue.textContent = String(trustScore);
  ui.trustScoreTier.textContent = trustTier(trustScore);
  ui.trustVolumeLabel.textContent = volumeLabel(Number(insights.ledger_count || 0));
  ui.trustRepLabel.textContent = reputationLabel(trustScore);
  ui.trustAgeLabel.textContent = formatAge(accountAgeDays);
  ui.totalSent.textContent = `${formatEq(insights.total_sent_eq)} Eq`;
  ui.totalReceived.textContent = `${formatEq(insights.total_received_eq)} Eq`;
  ui.fiatPaid.textContent = formatInr(insights.fiat_spent_inr);
  ui.cardCount.textContent = String(cardCount);
  ui.walletIdFull.textContent = profile.wallet_id || "-";
  ui.walletQrPayload.textContent = buildQrPayload(profile);
  ui.notificationCountPill.textContent = `${unreadCount} ${unreadCount === 1 ? "Unread" : "Unread"}`;
  ui.kycName.textContent = profile.full_name || "-";
  ui.kycEmail.textContent = profile.email || "-";
  ui.kycPhone.textContent = profile.phone_number || "Not provided";
  ui.kycCity.textContent = profile.location_city || "Not provided";
  ui.kycStatusText.textContent = profile.kyc_status || "PENDING";
  ui.kycWalletStatus.textContent = profile.status || "DORMANT";
  ui.cardProgramNote.textContent = buildCardProgramNote(profile, insights, paymentConfig);

  renderWalletReadiness(profile, insights, paymentConfig);
  renderHeroActions(profile, insights, paymentConfig);
}

function renderWalletReadiness(profile, insights, paymentConfig) {
  const activationFee = paymentConfig?.wallet_activation_fee_inr || 1500;
  const cardFee = paymentConfig?.card_issuance_fee_inr || 1500;
  const successfulPayments = Number(insights.successful_payment_count || 0);
  const cardCount = Number(insights.card_count || 0);
  const checkoutEnabled = Boolean(paymentConfig?.checkout_enabled);

  if (profile.status !== "ACTIVE") {
    ui.walletReadinessCopy.textContent =
      "Your wallet is currently dormant. A verified onboarding payment is required before the account becomes active and the initial 500 Eq balance is credited.";
    ui.walletReadinessList.innerHTML = `
      <ul class="bullet-note compact-list">
        <li>Activation fee: ${escapeHtml(formatInr(activationFee))}</li>
        <li>Post-payment credit: 500 Eq</li>
        <li>Checkout status: ${escapeHtml(checkoutEnabled ? "Ready for payment" : "Unavailable until Razorpay keys are configured")}</li>
      </ul>
    `;
    return;
  }

  ui.walletReadinessCopy.textContent =
    "Your wallet is active and ready for wallet-ID or QR-based payments. You can now issue additional virtual cards through verified payment orders.";
  ui.walletReadinessList.innerHTML = `
    <ul class="bullet-note compact-list">
      <li>Card issuance fee: ${escapeHtml(formatInr(cardFee))} per card</li>
      <li>Cards issued: ${escapeHtml(String(cardCount))} of 3 allowed</li>
      <li>Successful payment orders: ${escapeHtml(String(successfulPayments))}</li>
    </ul>
  `;
}

function renderHeroActions(profile, insights, paymentConfig) {
  const checkoutEnabled = Boolean(paymentConfig?.checkout_enabled);
  const cardCount = Number(insights.card_count || 0);

  if (profile.status !== "ACTIVE") {
    ui.heroPrimaryAction.textContent = `Activate Wallet for ${formatInr(paymentConfig?.wallet_activation_fee_inr || 1500)}`;
    ui.heroPrimaryAction.disabled = !checkoutEnabled;
    ui.heroSecondaryAction.textContent = "Review Payments";
    ui.heroSecondaryAction.dataset.mode = "payments";
    return;
  }

  if (!checkoutEnabled) {
    ui.heroPrimaryAction.textContent = "Checkout Unavailable";
    ui.heroPrimaryAction.disabled = true;
  } else if (cardCount >= 3) {
    ui.heroPrimaryAction.textContent = "Card Limit Reached";
    ui.heroPrimaryAction.disabled = true;
  } else {
    ui.heroPrimaryAction.textContent = `Issue Card for ${formatInr(paymentConfig?.card_issuance_fee_inr || 1500)}`;
    ui.heroPrimaryAction.disabled = false;
  }

  ui.heroSecondaryAction.textContent = "Open Wallet";
  ui.heroSecondaryAction.dataset.mode = "wallet";
}

function renderTransactions(items) {
  const walletId = state.data?.profile?.wallet_id;
  const recent = items.slice(0, 6);

  ui.recentTransactions.innerHTML = recent.length
    ? recent.map((item) => {
        const incoming = item.receiver_wallet === walletId;
        const amountClass = incoming ? "amount-positive" : "amount-negative";
        const sign = incoming ? "+" : "-";
        const counterpart = incoming ? item.sender_name || "System" : item.receiver_name || "Citizen";
        return `
          <div class="list-item">
            <div>
              <p class="list-title">${escapeHtml(prettyTransactionType(item.transaction_type))} • ${escapeHtml(counterpart)}</p>
              <p class="list-subtitle">${escapeHtml(item.note || "No payment note provided")} • ${formatDate(item.created_at)}</p>
              <p class="list-meta">${escapeHtml(item.status)}${item.latitude ? ` • GPS ${escapeHtml(item.latitude)}, ${escapeHtml(item.longitude)}` : ""}</p>
            </div>
            <div class="${amountClass}">${sign}${formatEq(item.amount)} Eq</div>
          </div>
        `;
      }).join("")
    : emptyState("No transaction activity yet. Activate the wallet or send Eq to begin building the ledger.");

  ui.walletTransactionAudit.innerHTML = recent.length
    ? recent.map((item) => `
        <div class="list-item">
          <div>
            <p class="list-title">${escapeHtml(shortId(item.transaction_id))}</p>
            <p class="list-subtitle">${escapeHtml(prettyTransactionType(item.transaction_type))} • ${formatDate(item.created_at)}</p>
          </div>
          <div class="list-meta">${escapeHtml(item.status)}</div>
        </div>
      `).join("")
    : emptyState("Transaction audit entries will appear here as soon as the wallet begins receiving activity.");
}

function renderNotifications(items) {
  ui.notificationFeed.innerHTML = items.length
    ? items.map((item) => `
        <div class="list-item">
          <div>
            <p class="list-title">${escapeHtml(item.title)}</p>
            <p class="list-subtitle">${escapeHtml(item.body)}</p>
          </div>
          <div class="list-meta">${formatDate(item.created_at)}</div>
        </div>
      `).join("")
    : emptyState("No notifications have been generated yet.");
}

function renderTrustHistory(items) {
  ui.trustFeed.innerHTML = items.length
    ? items.map((item) => `
        <div class="list-item">
          <div>
            <p class="list-title">${escapeHtml(item.reason)}</p>
            <p class="list-subtitle">${formatDate(item.created_at)}</p>
          </div>
          <div class="${Number(item.score_delta) >= 0 ? "amount-positive" : "amount-negative"}">
            ${Number(item.score_delta) >= 0 ? "+" : ""}${escapeHtml(String(item.score_delta))}
          </div>
        </div>
      `).join("")
    : emptyState("Reviews and completed contract activity will generate trust updates here.");
}

function renderSecurity(items) {
  ui.securityFeed.innerHTML = items.length
    ? items.map((item) => `
        <div class="list-item">
          <div>
            <p class="list-title">${escapeHtml(shortDevice(item.device_fingerprint || "Unknown device"))}</p>
            <p class="list-subtitle">${escapeHtml(item.ip_address || "Localhost")} • ${escapeHtml(item.login_status)}</p>
          </div>
          <div class="list-meta">${formatDate(item.created_at)}</div>
        </div>
      `).join("")
    : emptyState("Recent sign-in activity will appear here after authentication events.");
}

function renderCards(cards) {
  ui.paymentCardSelect.innerHTML = `<option value="">Use wallet directly</option>`;

  cards.forEach((card) => {
    if (!card.is_frozen) {
      ui.paymentCardSelect.insertAdjacentHTML(
        "beforeend",
        `<option value="${escapeHtml(card.card_id)}">${escapeHtml(card.card_name)} • ${escapeHtml(card.masked_card_number)}</option>`
      );
    }
  });

  const cardHtml = cards.length
    ? cards.map((card) => `
        <div class="bank-card ${card.is_frozen ? "frozen" : ""}">
          <div class="data-card-header">
            <div>
              <div class="bank-card-label">${escapeHtml(card.brand)} • ${escapeHtml(card.card_name)}</div>
              <div class="bank-card-number">${escapeHtml(card.masked_card_number)}</div>
            </div>
            <span class="pill ${card.is_frozen ? "muted" : "cyan"}">${card.is_frozen ? "Frozen" : "Active"}</span>
          </div>
          <div class="bank-card-meta">
            <span>Expiry ${escapeHtml(card.expiry_date)}</span>
            <span>${formatDate(card.created_at)}</span>
          </div>
          <div class="top-space">
            <button class="button ghost small" data-action="toggle-card-freeze" data-card-id="${escapeHtml(card.card_id)}">
              ${card.is_frozen ? "Unfreeze Card" : "Freeze Card"}
            </button>
          </div>
        </div>
      `).join("")
    : emptyState("No virtual cards issued yet. Complete a verified card payment to create one.");

  ui.walletCardPreview.innerHTML = cardHtml;
  ui.cardsGrid.innerHTML = cardHtml;
}

function renderPayments(payments) {
  ui.paymentCountPill.textContent = `${payments.length} ${payments.length === 1 ? "Order" : "Orders"}`;

  const shortFeed = payments.slice(0, 4);
  ui.commandPaymentFeed.innerHTML = shortFeed.length
    ? shortFeed.map(renderPaymentItem).join("")
    : emptyState("No payment orders yet. Wallet activation and card issuance will appear here.");

  ui.paymentsHistory.innerHTML = payments.length
    ? payments.map(renderPaymentItem).join("")
    : emptyState("Payment history will populate after a wallet activation or card issuance checkout flow.");
}

function renderPaymentItem(payment) {
  const label = payment.title || paymentPurposeLabel(payment.payment_purpose);
  const fulfillment = prettyFulfillmentStatus(payment.fulfillment_status);
  const gatewayStatus = payment.gateway_status ? `Gateway ${payment.gateway_status}` : "Gateway pending";
  const metadataCard = payment.metadata?.card_name ? ` • ${payment.metadata.card_name}` : "";
  return `
    <div class="list-item">
      <div>
        <p class="list-title">${escapeHtml(label)}${escapeHtml(metadataCard)}</p>
        <p class="list-subtitle">${escapeHtml(prettyPaymentStatus(payment.payment_status))} • ${escapeHtml(fulfillment)} • ${escapeHtml(gatewayStatus)}</p>
        <p class="list-meta">${escapeHtml(payment.receipt || "No receipt")} • ${formatDate(payment.created_at)}</p>
      </div>
      <div class="list-meta payment-amount-block">
        <strong>${escapeHtml(formatInr(payment.amount_inr))}</strong>
      </div>
    </div>
  `;
}

function renderSkills(skills) {
  const currentUser = state.data?.profile?.user_id;
  ui.skillsGrid.innerHTML = skills.length
    ? skills.map((skill) => {
        const isMine = skill.user_id === currentUser;
        return `
          <div class="data-card">
            <div class="data-card-header">
              <div>
                <strong>${escapeHtml(skill.skill_name)}</strong>
                <p>${escapeHtml(skill.full_name)}</p>
              </div>
              <span class="pill cyan">${formatEq(skill.rate_per_hour)} Eq/hr</span>
            </div>
            <p>${escapeHtml(skill.description || "No description provided.")}</p>
            <div class="data-card-header">
              <span class="list-meta">${formatDate(skill.created_at)}</span>
              ${
                isMine
                  ? `<span class="pill muted">Your Listing</span>`
                  : `<button class="button ghost cyan small" data-action="open-contract" data-skill-id="${escapeHtml(skill.skill_id)}" data-skill-name="${escapeHtml(skill.skill_name)}" data-rate="${escapeHtml(String(skill.rate_per_hour))}">Create Contract</button>`
              }
            </div>
          </div>
        `;
      }).join("")
    : emptyState("No marketplace listings are live yet. Publish a skill to begin the service flow.");
}

function renderContracts(contracts) {
  const currentUser = state.data?.profile?.user_id;
  ui.contractsGrid.innerHTML = contracts.length
    ? contracts.map((contract) => {
        const isConsumer = contract.consumer_id === currentUser;
        const counterpartName = isConsumer ? contract.provider_name : contract.consumer_name;
        const reviewSubjectId = isConsumer ? contract.provider_id : contract.consumer_id;
        return `
          <div class="data-card">
            <div class="data-card-header">
              <div>
                <strong>${escapeHtml(contract.skill_name)}</strong>
                <p>${escapeHtml(counterpartName)} • ${escapeHtml(contract.status)}</p>
              </div>
              <span class="pill">${formatEq(contract.total_eq)} Eq</span>
            </div>
            <p>${escapeHtml(contract.hours)} hour(s) • ${formatDate(contract.created_at)}</p>
            <div class="data-card-header">
              ${
                contract.status === "COMPLETED"
                  ? `<button class="button ghost cyan small" data-action="open-review" data-contract-id="${escapeHtml(contract.contract_id)}" data-subject-id="${escapeHtml(reviewSubjectId)}" data-subject-name="${escapeHtml(counterpartName)}">Add Review</button>`
                  : `<button class="button primary small" data-action="settle-contract" data-contract-id="${escapeHtml(contract.contract_id)}">Settle Contract</button>`
              }
              <span class="list-meta">${isConsumer ? "Consumer View" : "Provider View"}</span>
            </div>
          </div>
        `;
      }).join("")
    : emptyState("No contracts have been created yet. Hire a skill listing to demonstrate settlement.");
}

function renderPools(pools) {
  ui.poolsGrid.innerHTML = pools.length
    ? pools.map((pool) => `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <strong>${escapeHtml(pool.title)}</strong>
              <p>${escapeHtml(pool.creator_name)}</p>
            </div>
            <span class="pill ${pool.status === "COMPLETED" ? "cyan" : "muted"}">${escapeHtml(pool.status)}</span>
          </div>
          <p>${escapeHtml(pool.description || "No description provided.")}</p>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${Math.min(100, Number(pool.progress_percent || 0))}%"></div>
          </div>
          <div class="data-card-header">
            <span class="list-meta">${formatEq(pool.raised_amount)} / ${formatEq(pool.target_amount)} Eq • ${pool.contribution_count} contributions</span>
            ${
              pool.status === "ACTIVE"
                ? `<button class="button ghost cyan small" data-action="open-contribute" data-pool-id="${escapeHtml(pool.pool_id)}" data-pool-title="${escapeHtml(pool.title)}">Contribute</button>`
                : `<span class="pill cyan">Completed</span>`
            }
          </div>
        </div>
      `).join("")
    : emptyState("No community pools are live yet. Create one to demonstrate the pool workflow.");
}

function renderDirectory(directory) {
  ui.directoryGrid.innerHTML = directory.length
    ? directory.map((citizen) => `
        <div class="data-card">
          <div class="data-card-header">
            <div>
              <strong>${escapeHtml(citizen.full_name)}</strong>
              <p>${escapeHtml(citizen.location_city || "City not set")} • ${escapeHtml(citizen.kyc_status)}</p>
            </div>
            <span class="pill cyan">${escapeHtml(String(citizen.trust_score))}</span>
          </div>
          <p>${escapeHtml(String(citizen.skill_count))} active listing(s) • Wallet ${escapeHtml(citizen.wallet_status)}</p>
          <div class="data-card-header">
            <button class="button ghost small" data-action="prefill-transfer" data-wallet-id="${escapeHtml(citizen.wallet_id)}" data-name="${escapeHtml(citizen.full_name)}">Pay Citizen</button>
            <span class="list-meta">${escapeHtml(shortId(citizen.wallet_id))}</span>
          </div>
        </div>
      `).join("")
    : emptyState("No peer citizens found yet. Register a second account to demonstrate directory-based transfers.");
}

function renderQueryPresets(presets) {
  ui.queryPresetList.innerHTML = presets.length
    ? presets.map((preset) => `
        <button class="query-chip" data-action="run-preset-query" data-preset-id="${escapeHtml(preset.id)}">
          <strong>${escapeHtml(preset.label)}</strong>
          <span>${escapeHtml(preset.description)}</span>
        </button>
      `).join("")
    : emptyState("Query presets will appear once the dashboard bootstrap completes.");
}

function switchSection(sectionId) {
  state.activeSection = sectionId;

  document.querySelectorAll("[data-section]").forEach((section) => {
    const active = section.dataset.section === sectionId;
    section.classList.toggle("hidden", !active);
    section.classList.toggle("active", active);
  });

  document.querySelectorAll("[data-section-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.sectionTarget === sectionId);
  });

  const meta = sectionMeta[sectionId] || sectionMeta["command-center"];
  ui.topbarTitle.textContent = meta.title;
  ui.topbarSubtitle.textContent = meta.subtitle;
}

async function beginPaymentFlow(purpose, extra = {}) {
  const profile = state.data?.profile;
  const insights = state.data?.insights || {};
  const paymentConfig = state.data?.payment_config || {};

  if (!profile) {
    showToast("Session unavailable", "Sign in again to continue with payments.", "error");
    return;
  }

  if (state.paymentLocked) {
    showToast("Payment in progress", "Please complete or close the active checkout before starting another payment.", "warning");
    return;
  }

  if (!paymentConfig.checkout_enabled) {
    showToast("Checkout unavailable", "Razorpay credentials are missing or the checkout script is not ready.", "error");
    return;
  }

  if (purpose === "WALLET_ACTIVATION" && profile.status === "ACTIVE") {
    showToast("Wallet already active", "This wallet has already completed the onboarding payment.", "warning");
    return;
  }

  if (purpose === "CARD_ISSUANCE") {
    if (profile.status !== "ACTIVE") {
      showToast("Wallet activation required", "Activate the wallet before requesting a virtual card.", "error");
      return;
    }

    if (Number(insights.card_count || 0) >= 3) {
      showToast("Card limit reached", "This wallet has already reached the three-card limit.", "warning");
      return;
    }
  }

  state.paymentLocked = true;
  const coords = await getCoords();
  const response = await api("/api/payments/create-order", "POST", { purpose, ...extra, ...coords }, true);

  if (!response.success) {
    state.paymentLocked = false;
    showToast("Order creation failed", response.error || "The payment order could not be created.", "error");
    return;
  }

  if (typeof window.Razorpay === "undefined") {
    state.paymentLocked = false;
    showToast("Checkout library unavailable", "Razorpay Checkout did not load in the browser. Check connectivity and try again.", "error");
    return;
  }

  const orderId = response.payment_order?.payment_order_id;
  const options = {
    ...response.checkout,
    modal: {
      ondismiss: () => {
        if (state.paymentLocked) {
          state.paymentLocked = false;
          showToast("Checkout closed", "The payment window was closed before verification was completed.", "warning");
        }
      },
    },
    handler: async (gatewayResponse) => {
      await verifyCompletedPayment(orderId, gatewayResponse, coords, purpose);
    },
  };

  const checkout = new window.Razorpay(options);
  checkout.on("payment.failed", async (failure) => {
    state.paymentLocked = false;
    const failureMessage =
      failure?.error?.description ||
      failure?.error?.reason ||
      "Razorpay did not complete the payment successfully.";
    showToast("Payment failed", failureMessage, "error");
    await loadDashboard({ silent: true });
  });

  checkout.open();
}

async function verifyCompletedPayment(paymentOrderId, gatewayResponse, coords, purpose) {
  const payload = {
    payment_order_id: paymentOrderId,
    ...gatewayResponse,
    ...coords,
  };
  const response = await api("/api/payments/verify", "POST", payload, true);
  state.paymentLocked = false;

  if (!response.success) {
    showToast("Verification failed", response.error || "The payment could not be verified.", "error");
    await loadDashboard({ silent: true });
    return;
  }

  await loadDashboard({ silent: true });

  if (purpose === "CARD_ISSUANCE" && response.card) {
    document.getElementById("card-order-form").reset();
    openIssuedCardModal(response.card);
  }

  showToast(
    purpose === "WALLET_ACTIVATION" ? "Wallet activated" : "Card issued",
    response.message || "The verified payment was fulfilled successfully.",
    "success"
  );

  switchSection(purpose === "WALLET_ACTIVATION" ? "command-center" : "cards-payments");
}

async function runQuery(sql, preset) {
  const payload = preset ? { preset } : { sql };
  const response = await api("/api/query-demonstrator", "POST", payload, true);

  if (!response.success) {
    ui.queryMeta.textContent = response.error || "Query execution failed.";
    ui.querySqlOutput.textContent = "";
    ui.queryTableWrap.innerHTML = emptyState("No query result to display.");
    showToast("Query failed", response.error || "The SQL statement could not be executed.", "error");
    switchSection("query-lab");
    return;
  }

  renderQueryResult(response);
  switchSection("query-lab");
  showToast("Query executed", "Live MySQL results have been loaded into the demonstrator.", "success");
}

function renderQueryResult(result) {
  ui.queryMeta.textContent = `${result.row_count} row(s) • Executed ${formatDate(result.executed_at)}`;
  ui.querySqlOutput.textContent = result.query || "";

  if (!result.columns || !result.columns.length) {
    ui.queryTableWrap.innerHTML = emptyState("No table columns were returned.");
    return;
  }

  const header = result.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
  const rows = (result.rows || []).length
    ? result.rows.map((row) => `
        <tr>
          ${result.columns.map((column) => `<td>${escapeHtml(normalizeCell(row[column]))}</td>`).join("")}
        </tr>
      `).join("")
    : `<tr><td colspan="${result.columns.length}">No rows returned.</td></tr>`;

  ui.queryTableWrap.innerHTML = `
    <table>
      <thead><tr>${header}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function openQrModal() {
  if (!state.data?.profile) {
    return;
  }

  const payload = buildQrPayload(state.data.profile);
  ui.qrRender.innerHTML = "";
  ui.qrWalletLabel.textContent = payload;

  if (typeof window.QRCode !== "undefined") {
    new window.QRCode(ui.qrRender, {
      text: payload,
      width: 220,
      height: 220,
      colorDark: "#00f1fe",
      colorLight: "#0b0f1b",
      correctLevel: window.QRCode.CorrectLevel.H,
    });
  } else {
    ui.qrRender.innerHTML = emptyState("QR generator not available. Copy the wallet payload instead.");
  }

  openModal("qr-modal");
}

function openScanModal() {
  openModal("scan-modal");
  startScanner();
}

function openStaticPage(pageId) {
  const page = staticPages[pageId] || staticPages.about;
  ui.pageModalTitle.textContent = page.title;
  ui.pageModalBody.innerHTML = page.body;
  openModal("page-modal");
}

function openContractModal(skillId, skillName, rate) {
  ui.contractForm.reset();
  ui.contractForm.elements.skill_id.value = skillId || "";
  ui.contractSubtitle.textContent = `${skillName || "Selected skill"} • ${formatEq(rate || 0)} Eq per hour`;
  openModal("contract-modal");
}

function openContributeModal(poolId, poolTitle) {
  ui.contributeForm.reset();
  ui.contributeForm.elements.pool_id.value = poolId || "";
  ui.contributeSubtitle.textContent = `Pool: ${poolTitle || "Selected pool"}`;
  openModal("contribute-modal");
}

function openReviewModal(contractId, subjectId, subjectName) {
  ui.reviewForm.reset();
  ui.reviewForm.elements.contract_id.value = contractId || "";
  ui.reviewForm.elements.subject_id.value = subjectId || "";
  ui.reviewSubtitle.textContent = `Reviewing ${subjectName || "counterparty"} after contract settlement`;
  openModal("review-modal");
}

function openIssuedCardModal(card) {
  ui.issuedCardLabel.textContent = card.card_name || "Primary";
  ui.issuedCardNumber.textContent = card.card_number || card.masked_card_number || "-";
  ui.issuedCardExpiry.textContent = card.expiry_date || "-";
  ui.issuedCardCvv.textContent = card.cvv || "***";
  openModal("issued-card-modal");
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
  }

  if (modalId === "scan-modal") {
    stopScanner();
  }
}

function prefillTransfer(walletId, name) {
  switchSection("wallet-hub");
  ui.receiverWalletInput.value = walletId || "";
  ui.paymentNoteInput.value = name ? `Payment to ${name}` : "";
  ui.receiverWalletInput.focus();
  showToast("Transfer form updated", "Receiver details were loaded from the citizen directory.", "success");
}

function buildQrPayload(profile) {
  return JSON.stringify({
    wallet_id: profile.wallet_id,
    display_name: profile.full_name,
    type: "EQUINOX_WALLET",
    version: "1.0",
  });
}

function processScannedPayload(decodedText) {
  const parsed = parseQrPayload(decodedText);
  if (!parsed) {
    showToast("Unsupported QR payload", "Use an Equinox wallet QR, a UPI QR, or a raw wallet UUID.", "error");
    return;
  }

  if (parsed.walletId) {
    prefillTransfer(parsed.walletId, parsed.displayName || "");
    if (parsed.displayName) {
      ui.paymentNoteInput.value = `Payment to ${parsed.displayName}`;
    }
    closeModal("scan-modal");
    showToast("Wallet captured", "The receiver wallet was loaded from the scanned QR.", "success");
    return;
  }

  if (parsed.upiReference) {
    switchSection("wallet-hub");
    ui.paymentNoteInput.value = `UPI reference scanned: ${parsed.upiReference}`;
    closeModal("scan-modal");
    showToast("Reference captured", "Add the Equinox receiver wallet to complete the Eq transfer.", "success");
  }
}

function parseQrPayload(decodedText) {
  const text = String(decodedText || "").trim();
  if (!text) {
    return null;
  }

  try {
    const data = JSON.parse(text);
    if (data.type === "EQUINOX_WALLET" && isUuid(data.wallet_id)) {
      return {
        walletId: data.wallet_id,
        displayName: data.display_name || "",
      };
    }
  } catch (_) {
  }

  if (/^upi:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      return {
        upiReference: url.searchParams.get("pa") || url.searchParams.get("pn") || "UPI QR",
      };
    } catch (_) {
    }
  }

  if (isUuid(text)) {
    return { walletId: text, displayName: "" };
  }

  return null;
}

function startScanner() {
  stopScanner();
  ui.qrScanner.innerHTML = "";

  if (typeof window.Html5QrcodeScanner === "undefined") {
    ui.qrScanner.innerHTML = emptyState("QR scanner library did not load. Use the manual payload option instead.");
    return;
  }

  state.scanner = new window.Html5QrcodeScanner(
    "qr-scanner",
    {
      fps: 10,
      qrbox: { width: 240, height: 240 },
      rememberLastUsedCamera: true,
    },
    false
  );

  state.scanner.render(
    (decodedText) => processScannedPayload(decodedText),
    () => {}
  );
}

function stopScanner() {
  if (state.scanner && typeof state.scanner.clear === "function") {
    try {
      state.scanner.clear();
    } catch (_) {
    }
  }
  state.scanner = null;
}

function startAutoRefresh() {
  if (state.refreshTimer) {
    clearInterval(state.refreshTimer);
  }

  state.refreshTimer = setInterval(() => {
    if (state.token) {
      loadDashboard({ silent: true });
    }
  }, 12000);
}

async function copyText(text, successTitle = "Copied to clipboard") {
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast(successTitle, "The value is now available in your clipboard.", "success");
  } catch (_) {
    showToast("Clipboard unavailable", "The current browser did not allow clipboard access.", "error");
  }
}

async function getCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: null, longitude: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve({ latitude: null, longitude: null }),
      { enableHighAccuracy: false, timeout: 4000 }
    );
  });
}

async function api(url, method = "GET", payload = null, auth = false) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (auth && state.token) {
    options.headers.Authorization = `Bearer ${state.token}`;
  }

  if (payload && method !== "GET") {
    options.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function showToast(title, message = "", type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-title">${escapeHtml(title)}</div>
    ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ""}
  `;
  ui.toastStack.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

function buildCardProgramNote(profile, insights, paymentConfig) {
  if (profile.status !== "ACTIVE") {
    return "Activate the wallet first. Card issuance is available only after the onboarding payment has been verified.";
  }

  const cardCount = Number(insights.card_count || 0);
  if (cardCount >= 3) {
    return "The wallet has reached the three-card issuance limit enforced at the database level.";
  }

  return `Each new card requires a verified ${formatInr(paymentConfig?.card_issuance_fee_inr || 1500)} payment before the card number is generated.`;
}

function prettyTransactionType(type) {
  const map = {
    P2P: "Peer Transfer",
    DEPOSIT: "Wallet Activation",
    POOL: "Pool Contribution",
    CONTRACT: "Contract Settlement",
    REFUND: "Refund",
  };
  return map[type] || type || "Transaction";
}

function paymentPurposeLabel(purpose) {
  return purpose === "CARD_ISSUANCE" ? "Virtual Card Issuance Fee" : "Wallet Activation Fee";
}

function prettyPaymentStatus(status) {
  const map = {
    PAID: "Paid",
    PENDING: "Pending",
    FAILED: "Failed",
  };
  return map[status] || status || "Pending";
}

function prettyFulfillmentStatus(status) {
  const map = {
    COMPLETED: "Fulfilled",
    PENDING: "Fulfillment Pending",
    FAILED: "Fulfillment Failed",
  };
  return map[status] || status || "Pending";
}

function formatEq(value) {
  return Number(value || 0).toFixed(2);
}

function formatInr(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function formatAge(days) {
  if (!days || days < 1) {
    return "New";
  }

  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? "Year" : "Years"}`;
  }

  return `${days} ${days === 1 ? "Day" : "Days"}`;
}

function formatDate(value) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function trustTier(score) {
  if (score >= 85) return "Radiant";
  if (score >= 70) return "Resonant";
  if (score >= 55) return "Stable";
  return "Neutral";
}

function volumeLabel(count) {
  if (count >= 20) return "High";
  if (count >= 8) return "Growing";
  if (count >= 1) return "Building";
  return "New";
}

function reputationLabel(score) {
  if (score >= 85) return "Stellar";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Healthy";
  return "Stable";
}

function initials(name) {
  return String(name || "Equinox")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function shortDevice(device) {
  return String(device).replace(/\s+/g, " ").slice(0, 48);
}

function shortId(id) {
  if (!id || id.length < 12) {
    return id || "-";
  }
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function normalizeCell(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

if (state.token) {
  enterApp();
  loadDashboard();
}
