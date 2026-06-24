const STORAGE_KEY = "uchus_rf_state";
const ADMIN_LOGIN = "Admin26";
const ADMIN_PASSWORD = "Demo20";
const ADMIN_PAGE_SIZE = 6;

const courseLabels = {
    povyshenie: "Повышение квалификации",
    perepodgotovka: "Курс переподготовки",
    ohrana_truda: "Курс по охране труда",
};

const paymentLabels = {
    qr: "Предоплата по QR-коду",
    mir: "Оплата картой МИР",
    ofis: "Постоплата в офисе организации",
};

const statusLabels = {
    novaya: "Новая",
    obuchenie: "Идет обучение",
    zavershena: "Обучение завершено",
};

const app = document.querySelector("#app");
const nav = document.querySelector("[data-nav]");
const messages = document.querySelector("[data-messages]");

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        normalizeState(parsed);
        return parsed;
    }

    const state = {
        session: null,
        users: [
            {
                id: 1,
                fio: "Администратор",
                telefon: "+7(495)-123-45-67",
                email: "admin@example.ru",
                username: ADMIN_LOGIN,
                password: ADMIN_PASSWORD,
                isStaff: true,
            },
        ],
        requests: [],
        nextUserId: 2,
        nextRequestId: 1,
    };
    saveState(state);
    return state;
}

function normalizeState(nextState) {
    const admin = nextState.users.find((user) => user.isStaff) || nextState.users[0];
    if (admin) {
        admin.fio = admin.fio || "Администратор";
        admin.telefon = admin.telefon || "+7(495)-123-45-67";
        admin.email = admin.email || "admin@example.ru";
        admin.username = ADMIN_LOGIN;
        admin.password = ADMIN_PASSWORD;
        admin.isStaff = true;
    }
    saveState(nextState);
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function currentUser() {
    return state.users.find((user) => user.id === state.session) || null;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
}

function parseRuDate(value) {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
    if (!match) return null;

    const [, day, month, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const isValid = date.getFullYear() === Number(year)
        && date.getMonth() === Number(month) - 1
        && date.getDate() === Number(day);

    return isValid ? `${year}-${month}-${day}` : null;
}

function nowDateTime() {
    const date = new Date();
    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function routeTo(route) {
    window.location.hash = route;
}

function homeRoute() {
    const user = currentUser();
    if (!user) return "/login";
    return user.isStaff ? "/admin" : "/cabinet";
}

function showMessage(text, type = "success") {
    const item = document.createElement("div");
    item.className = `uvedomlenie__okno uvedomlenie__okno--${type}`;
    item.innerHTML = `<span>${escapeHtml(text)}</span><button type="button" aria-label="Закрыть" data-close-message>×</button>`;
    messages.appendChild(item);
    item.querySelector("[data-close-message]").addEventListener("click", () => item.remove());
    window.setTimeout(() => item.remove(), 5000);
}

function clearFieldErrors(form) {
    form.querySelectorAll(".pole__error").forEach((error) => error.remove());
}

function showFieldError(form, name, text) {
    const field = form.elements[name];
    if (!field) return;

    const pole = field.closest(".pole");
    const error = document.createElement("span");
    error.className = "pole__error";
    error.textContent = text;
    pole.appendChild(error);
}

function setFieldErrors(form, errors) {
    clearFieldErrors(form);
    Object.entries(errors).forEach(([name, text]) => showFieldError(form, name, text));
    const firstName = Object.keys(errors)[0];
    if (firstName && form.elements[firstName]) {
        form.elements[firstName].focus();
    }
}

function renderNav() {
    const user = currentUser();
    if (!user) {
        nav.innerHTML = "";
        return;
    }

    nav.innerHTML = user.isStaff
        ? `<a href="#/admin" data-link>Заявки</a><button class="ssylka-knopka" type="button" data-logout>Выйти</button>`
        : `<a href="#/cabinet" data-link>Личный кабинет</a><a href="#/request" data-link>Новая заявка</a><button class="ssylka-knopka" type="button" data-logout>Выйти</button>`;

    nav.querySelector("[data-logout]").addEventListener("click", () => {
        state.session = null;
        saveState(state);
        routeTo("/login");
        render();
    });
}

function authLayout(content) {
    return `
        <section class="auth">
            <div class="container">
                <div class="auth__container">
                    <div class="auth__info">
                        <span class="metka">Дистанционное обучение</span>
                        <h1>Учитесь в удобном темпе</h1>
                        <p>Повышение квалификации, переподготовка и курсы по охране труда.</p>
                        <div class="auth__image">
                            <img src="assets/img/hero.webp" alt="Выпускница онлайн-курса">
                        </div>
                    </div>
                    <div class="auth__forma">${content}</div>
                </div>
            </div>
        </section>`;
}

function renderLogin() {
    if (currentUser()) {
        routeTo(homeRoute());
        return;
    }

    app.innerHTML = authLayout(`
        <div class="forma-card">
            <p class="nadpis">Личный кабинет</p>
            <h2>Вход</h2>
            <p class="forma-card__opisanie">Введите данные, указанные при регистрации.</p>
            <form data-login-form novalidate>
                <div class="pole">
                    <label for="login-username">Логин</label>
                    <input id="login-username" name="username" autocomplete="username" placeholder="Введите логин" required>
                </div>
                <div class="pole">
                    <label for="login-password">Пароль</label>
                    <input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Введите пароль" required>
                </div>
                <button class="button button--wide" type="submit">Войти</button>
            </form>
            <a class="auth__link" href="#/register" data-link>Еще не зарегистрированы? Регистрация</a>
        </div>`);

    app.querySelector("[data-login-form]").addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const user = state.users.find(
            (item) => item.username === data.get("username").trim() && item.password === data.get("password")
        );
        if (!user) {
            showMessage("Неверный логин или пароль.", "error");
            return;
        }
        state.session = user.id;
        saveState(state);
        routeTo(user.isStaff ? "/admin" : "/cabinet");
        render();
    });
}

function renderRegister() {
    app.innerHTML = `
        <section class="stranica-formy">
            <div class="container uzkaya-oblast">
                <div class="zagolovok-stranicy">
                    <span class="metka">Новая учетная запись</span>
                    <h1>Регистрация</h1>
                    <p>Все поля обязательны для заполнения.</p>
                </div>
                <div class="forma-card forma-card--wide">
                    <form data-register-form novalidate>
                        <div class="setka-poley">
                            <div class="pole pole--wide">
                                <label for="fio">ФИО</label>
                                <input id="fio" name="fio" placeholder="Иванов Иван Иванович" required>
                            </div>
                            <div class="pole">
                                <label for="telefon">Телефон</label>
                                <input id="telefon" name="telefon" placeholder="+7(999)-123-45-67" inputmode="tel" autocomplete="tel" maxlength="18" data-phone-mask required>
                            </div>
                            <div class="pole pole--wide">
                                <label for="email">E-mail</label>
                                <input id="email" name="email" type="email" placeholder="mail@example.ru" required>
                            </div>
                            <div class="pole">
                                <label for="username">Логин</label>
                                <input id="username" name="username" placeholder="Латинские буквы и цифры" autocomplete="username" required>
                                <span class="pole__podskazka">Минимум 6 символов: латинские буквы и цифры.</span>
                            </div>
                            <div class="pole">
                                <label for="password1">Пароль</label>
                                <input id="password1" name="password1" type="password" placeholder="Не менее 8 символов" autocomplete="new-password" required>
                            </div>
                            <div class="pole">
                                <label for="password2">Повторите пароль</label>
                                <input id="password2" name="password2" type="password" placeholder="Повторите пароль" autocomplete="new-password" required>
                            </div>
                        </div>
                        <button class="button button--wide" type="submit">Зарегистрироваться</button>
                    </form>
                    <a class="auth__link" href="#/login" data-link>Уже зарегистрированы? Войти</a>
                </div>
            </div>
        </section>`;

    initPhoneMask();
    app.querySelector("[data-register-form]").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        const username = data.username.trim();
        const errors = {};

        if (!data.fio.trim()) {
            errors.fio = "Укажите ФИО.";
        }
        if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
            errors.email = "Введите корректный e-mail.";
        }
        if (!/^[A-Za-z0-9]{6,}$/.test(username) || !/[A-Za-z]/.test(username) || !/\d/.test(username)) {
            errors.username = "Логин должен содержать минимум 6 символов, буквы и цифры.";
        }
        if (!/^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$/.test(data.telefon)) {
            errors.telefon = "Введите телефон в формате +7(XXX)-XXX-XX-XX.";
        }
        if (data.password1.length < 8) {
            errors.password1 = "Пароль должен быть не короче 8 символов.";
        }
        if (data.password1 !== data.password2) {
            errors.password2 = "Пароли должны совпадать.";
        }
        if (state.users.some((user) => user.username === username)) {
            errors.username = "Пользователь с таким логином уже существует.";
        }
        if (Object.keys(errors).length) {
            setFieldErrors(form, errors);
            return;
        }
        clearFieldErrors(form);

        const user = {
            id: state.nextUserId++,
            fio: data.fio.trim(),
            telefon: data.telefon,
            email: data.email.trim(),
            username,
            password: data.password1,
            isStaff: false,
        };
        state.users.push(user);
        state.session = user.id;
        saveState(state);
        showMessage("Регистрация завершена. Учетная запись создана.");
        routeTo("/cabinet");
        render();
    });
}

function sliderMarkup() {
    return `
        <div class="slider" data-slider>
            <div class="slider__viewport">
                <div class="slider__line" data-slider-line>
                    <article class="slider__slide"><img src="assets/img/slide-1.webp" alt="Дистанционное обучение"><div class="slider__tekst"><span>01</span><h2>Дистанционное обучение</h2></div></article>
                    <article class="slider__slide"><img src="assets/img/slide-2.webp" alt="Курсы повышения квалификации"><div class="slider__tekst"><span>02</span><h2>Повышение квалификации</h2></div></article>
                    <article class="slider__slide"><img src="assets/img/slide-3.webp" alt="Профессиональная переподготовка"><div class="slider__tekst"><span>03</span><h2>Профессиональная переподготовка</h2></div></article>
                    <article class="slider__slide"><img src="assets/img/slide-4.webp" alt="Курс по охране труда"><div class="slider__tekst"><span>04</span><h2>Охрана труда</h2></div></article>
                </div>
            </div>
            <div class="slider__controls">
                <button type="button" data-slider-prev aria-label="Предыдущий слайд">←</button>
                <div class="slider__dots" data-slider-dots></div>
                <button type="button" data-slider-next aria-label="Следующий слайд">→</button>
            </div>
        </div>`;
}

function renderCabinet() {
    const user = requireUser(false);
    if (!user) return;

    const requests = state.requests.filter((item) => item.userId === user.id);
    app.innerHTML = `
        <section class="kabinet-shapka">
            <div class="container kabinet-shapka__inner">
                <div>
                    <span class="metka">Личный кабинет</span>
                    <h1>${escapeHtml(user.fio)}</h1>
                    <p>${escapeHtml(user.email)} · ${escapeHtml(user.telefon)}</p>
                </div>
                <a class="button" href="#/request" data-link>Оформить заявку</a>
            </div>
        </section>
        <section class="container kabinet-content">
            ${sliderMarkup()}
            <div class="razdel-zagolovok">
                <div><span class="nadpis">История</span><h2>Ваши заявки</h2></div>
                <span class="schetchik">${requests.length}</span>
            </div>
            ${requests.length ? `<div class="cards">${requests.map(requestCard).join("")}</div>` : emptyCabinet()}
        </section>`;

    initSlider();
}

function requestCard(request) {
    return `
        <article class="card">
            <div class="card__verh">
                <span class="status status--${request.status}">${statusLabels[request.status]}</span>
                <span class="card__nomer">№${request.id}</span>
            </div>
            <h3>${courseLabels[request.course]}</h3>
            <dl class="card__dannye">
                <div><dt>Начало</dt><dd>${formatDate(request.startDate)}</dd></div>
                <div><dt>Оплата</dt><dd>${paymentLabels[request.payment]}</dd></div>
                <div><dt>Создана</dt><dd>${request.createdDate}</dd></div>
            </dl>
            ${request.status === "zavershena" ? reviewBlock(request) : ""}
        </article>`;
}

function reviewBlock(request) {
    if (request.review) {
        return `<div class="otzyv-preview"><p>${escapeHtml(request.review)}</p></div>`;
    }
    return `<a class="button button--secondary" href="#/review/${request.id}" data-link>Оставить отзыв</a>`;
}

function emptyCabinet() {
    return `
        <div class="pustoe-sostoyanie">
            <span>01</span>
            <h3>Заявок пока нет</h3>
            <p>Выберите курс, дату начала и удобный способ оплаты.</p>
            <a class="button" href="#/request" data-link>Оформить первую заявку</a>
        </div>`;
}

function renderRequestForm() {
    const user = requireUser(false);
    if (!user) return;

    app.innerHTML = `
        <section class="stranica-formy">
            <div class="container uzkaya-oblast">
                <div class="zagolovok-stranicy">
                    <span class="metka">Запись на обучение</span>
                    <h1>Новая заявка</h1>
                    <p>После отправки заявка поступит администратору на согласование.</p>
                </div>
                <div class="forma-card forma-card--wide">
                    <form data-request-form novalidate>
                        ${selectField("vid_kursa", "Вид курса", courseLabels)}
                        <div class="pole">
                            <label for="data_nachala">Дата начала обучения</label>
                            <input id="data_nachala" name="data_nachala" inputmode="numeric" placeholder="ДД.ММ.ГГГГ" maxlength="10" required>
                        </div>
                        ${selectField("sposob_oplaty", "Способ оплаты", paymentLabels)}
                        <div class="forma-actions">
                            <a class="button button--ghost" href="#/cabinet" data-link>Отмена</a>
                            <button class="button" type="submit">Отправить заявку</button>
                        </div>
                    </form>
                </div>
            </div>
        </section>`;

    initDateMask();
    app.querySelector("[data-request-form]").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        const startDate = parseRuDate(data.data_nachala);
        const errors = {};

        if (!data.vid_kursa) errors.vid_kursa = "Выберите курс.";
        if (!startDate) errors.data_nachala = "Введите дату в формате ДД.ММ.ГГГГ.";
        if (!data.sposob_oplaty) errors.sposob_oplaty = "Выберите способ оплаты.";

        if (Object.keys(errors).length) {
            setFieldErrors(form, errors);
            return;
        }
        clearFieldErrors(form);

        state.requests.push({
            id: state.nextRequestId++,
            userId: user.id,
            course: data.vid_kursa,
            startDate,
            payment: data.sposob_oplaty,
            status: "novaya",
            createdAt: Date.now(),
            createdDate: new Date().toLocaleDateString("ru-RU"),
            createdDateTime: nowDateTime(),
            review: "",
        });
        saveState(state);
        showMessage("Заявка отправлена на согласование.");
        routeTo("/cabinet");
        render();
    });
}

function selectField(name, label, options, selected = "") {
    return `
        <div class="pole">
            <label for="${name}">${label}</label>
            <select id="${name}" name="${name}" required>
                <option value="">Выберите значение</option>
                ${Object.entries(options).map(([value, text]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${text}</option>`).join("")}
            </select>
        </div>`;
}

function renderReview(id) {
    const user = requireUser(false);
    if (!user) return;
    const request = state.requests.find((item) => item.id === Number(id) && item.userId === user.id);
    if (!request || request.status !== "zavershena" || request.review) {
        routeTo("/cabinet");
        render();
        return;
    }

    app.innerHTML = `
        <section class="stranica-formy">
            <div class="container uzkaya-oblast">
                <div class="zagolovok-stranicy">
                    <span class="metka">Заявка №${request.id}</span>
                    <h1>Оставить отзыв</h1>
                    <p>${courseLabels[request.course]}</p>
                </div>
                <div class="forma-card forma-card--wide">
                    <form data-review-form novalidate>
                        <div class="pole">
                            <label for="tekst">Отзыв</label>
                            <textarea id="tekst" name="tekst" rows="4" maxlength="1000" placeholder="Расскажите о прохождении курса" required></textarea>
                        </div>
                        <div class="forma-actions">
                            <a class="button button--ghost" href="#/cabinet" data-link>Отмена</a>
                            <button class="button" type="submit">Сохранить отзыв</button>
                        </div>
                    </form>
                </div>
            </div>
        </section>`;

    app.querySelector("[data-review-form]").addEventListener("submit", (event) => {
        event.preventDefault();
        const text = new FormData(event.currentTarget).get("tekst").trim();
        if (!text) {
            showMessage("Введите текст отзыва.", "error");
            return;
        }
        request.review = text;
        saveState(state);
        showMessage("Отзыв сохранен.");
        routeTo("/cabinet");
        render();
    });
}

function renderAdmin() {
    const user = requireUser(true);
    if (!user) return;

    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const filters = {
        poisk: params.get("poisk") || "",
        status: params.get("status") || "",
        kurs: params.get("kurs") || "",
        sort: params.get("sort") || "-sozdana",
    };
    const allRequests = filteredRequests(filters);
    const totalPages = Math.max(1, Math.ceil(allRequests.length / ADMIN_PAGE_SIZE));
    const currentPage = Math.min(Math.max(Number(params.get("page")) || 1, 1), totalPages);
    const pageStart = (currentPage - 1) * ADMIN_PAGE_SIZE;
    const requests = allRequests.slice(pageStart, pageStart + ADMIN_PAGE_SIZE);

    app.innerHTML = `
        <section class="admin-shapka">
            <div class="container">
                <span class="metka">Панель администратора</span>
                <h1>Управление заявками</h1>
                <p>Проверка заявок и изменение статусов обучения.</p>
            </div>
        </section>
        <section class="container admin-content">
            <form class="filtry" data-admin-filter>
                <div class="pole"><label for="poisk">Поиск</label><input id="poisk" name="poisk" value="${escapeHtml(filters.poisk)}" placeholder="ФИО, логин или e-mail"></div>
                ${selectFieldWithEmpty("status", "Статус", statusLabels, filters.status, "Все статусы")}
                ${selectFieldWithEmpty("kurs", "Курс", courseLabels, filters.kurs, "Все курсы")}
                <div class="pole">
                    <label for="sort">Сортировка</label>
                    <select id="sort" name="sort">
                        <option value="-sozdana" ${filters.sort === "-sozdana" ? "selected" : ""}>Сначала новые</option>
                        <option value="sozdana" ${filters.sort === "sozdana" ? "selected" : ""}>Сначала старые</option>
                        <option value="data_nachala" ${filters.sort === "data_nachala" ? "selected" : ""}>По дате начала</option>
                        <option value="-data_nachala" ${filters.sort === "-data_nachala" ? "selected" : ""}>Дата начала убывает</option>
                        <option value="fio" ${filters.sort === "fio" ? "selected" : ""}>По ФИО</option>
                    </select>
                </div>
                <button class="button" type="submit">Применить</button>
                <a class="button button--ghost" href="#/admin" data-link>Сбросить</a>
            </form>
            <div class="admin-itog">
                <span>Найдено: ${allRequests.length}</span>
                <span>Страница ${currentPage} из ${totalPages}</span>
            </div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Заявка</th><th>Пользователь</th><th>Курс</th><th>Начало</th><th>Оплата</th><th>Статус</th></tr></thead>
                    <tbody>${requests.length ? requests.map(adminRow).join("") : `<tr><td class="net-dannyh" colspan="6">Заявки по заданным условиям не найдены.</td></tr>`}</tbody>
                </table>
            </div>
            ${adminPagination(filters, currentPage, totalPages)}
        </section>`;

    app.querySelector("[data-admin-filter]").addEventListener("submit", (event) => {
        event.preventDefault();
        const query = new URLSearchParams(new FormData(event.currentTarget)).toString();
        routeTo(`/admin?${query}`);
        render();
    });

    app.querySelectorAll("[data-status-form]").forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const id = Number(form.dataset.statusForm);
            const request = state.requests.find((item) => item.id === id);
            if (!request) return;
            request.status = new FormData(form).get("status");
            saveState(state);
            showMessage(`Статус заявки №${id} изменен.`);
            render();
        });
    });
}

function selectFieldWithEmpty(name, label, options, selected, emptyLabel) {
    return `
        <div class="pole">
            <label for="${name}">${label}</label>
            <select id="${name}" name="${name}">
                <option value="">${emptyLabel}</option>
                ${Object.entries(options).map(([value, text]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${text}</option>`).join("")}
            </select>
        </div>`;
}

function adminQuery(filters, page) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value);
    });
    if (page > 1) query.set("page", String(page));
    const result = query.toString();
    return result ? `?${result}` : "";
}

function adminPagination(filters, currentPage, totalPages) {
    if (totalPages <= 1) return "";

    const links = [];
    if (currentPage > 1) {
        links.push(`<a href="#/admin${adminQuery(filters, currentPage - 1)}" data-link>←</a>`);
    }
    for (let page = 1; page <= totalPages; page += 1) {
        links.push(page === currentPage
            ? `<span>${page}</span>`
            : `<a href="#/admin${adminQuery(filters, page)}" data-link>${page}</a>`);
    }
    if (currentPage < totalPages) {
        links.push(`<a href="#/admin${adminQuery(filters, currentPage + 1)}" data-link>→</a>`);
    }

    return `<nav class="pagination" aria-label="Постраничная навигация">${links.join("")}</nav>`;
}

function filteredRequests(filters) {
    const result = state.requests.filter((request) => {
        const user = state.users.find((item) => item.id === request.userId);
        const haystack = `${user?.fio || ""} ${user?.username || ""} ${user?.email || ""}`.toLowerCase();
        return (!filters.status || request.status === filters.status)
            && (!filters.kurs || request.course === filters.kurs)
            && (!filters.poisk || haystack.includes(filters.poisk.toLowerCase()));
    });

    result.sort((a, b) => {
        if (filters.sort === "sozdana") return a.createdAt - b.createdAt;
        if (filters.sort === "data_nachala") return a.startDate.localeCompare(b.startDate);
        if (filters.sort === "-data_nachala") return b.startDate.localeCompare(a.startDate);
        if (filters.sort === "fio") return getUser(a).fio.localeCompare(getUser(b).fio, "ru");
        return b.createdAt - a.createdAt;
    });
    return result;
}

function getUser(request) {
    return state.users.find((user) => user.id === request.userId) || {};
}

function adminRow(request) {
    const user = getUser(request);
    return `
        <tr>
            <td><strong>№${request.id}</strong><small>${request.createdDateTime}</small></td>
            <td><strong>${escapeHtml(user.fio)}</strong><small>${escapeHtml(user.username)} · ${escapeHtml(user.email)}</small></td>
            <td>${courseLabels[request.course]}</td>
            <td>${formatDate(request.startDate)}</td>
            <td>${paymentLabels[request.payment]}</td>
            <td>
                <form class="status-forma" data-status-form="${request.id}">
                    <select name="status" aria-label="Статус заявки №${request.id}">
                        ${Object.entries(statusLabels).map(([value, text]) => `<option value="${value}" ${request.status === value ? "selected" : ""}>${text}</option>`).join("")}
                    </select>
                    <button type="submit">Сохранить</button>
                </form>
            </td>
        </tr>`;
}

function requireUser(staffOnly) {
    const user = currentUser();
    if (!user) {
        routeTo("/login");
        render();
        return null;
    }
    if (staffOnly && !user.isStaff) {
        routeTo("/cabinet");
        render();
        return null;
    }
    if (!staffOnly && user.isStaff) {
        routeTo("/admin");
        render();
        return null;
    }
    return user;
}

function initPhoneMask() {
    document.querySelectorAll("[data-phone-mask]").forEach((input) => {
        const formatPhone = () => {
            let digits = input.value.replace(/\D/g, "");
            if (digits.startsWith("8")) digits = digits.slice(1);
            else if (digits.startsWith("7")) digits = digits.slice(1);
            digits = digits.slice(0, 10);

            let value = "+7";
            if (digits.length > 0) value += `(${digits.slice(0, 3)}`;
            if (digits.length >= 3) value += ")";
            if (digits.length > 3) value += `-${digits.slice(3, 6)}`;
            if (digits.length > 6) value += `-${digits.slice(6, 8)}`;
            if (digits.length > 8) value += `-${digits.slice(8, 10)}`;
            input.value = value;
        };

        input.addEventListener("focus", () => {
            if (!input.value) input.value = "+7";
        });
        input.addEventListener("input", formatPhone);
        input.addEventListener("blur", () => {
            if (input.value === "+7") input.value = "";
        });
    });
}

function initDateMask() {
    document.querySelectorAll("#data_nachala").forEach((input) => {
        input.addEventListener("input", () => {
            const digits = input.value.replace(/\D/g, "").slice(0, 8);
            let value = digits.slice(0, 2);
            if (digits.length > 2) value += `.${digits.slice(2, 4)}`;
            if (digits.length > 4) value += `.${digits.slice(4, 8)}`;
            input.value = value;
        });
    });
}

function initSlider() {
    document.querySelectorAll("[data-slider]").forEach((slider) => {
        const line = slider.querySelector("[data-slider-line]");
        const slides = Array.from(line.children);
        const dotsArea = slider.querySelector("[data-slider-dots]");
        let current = 0;
        let timer;

        const dots = slides.map((slide, index) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("aria-label", `Слайд ${index + 1}`);
            dot.addEventListener("click", () => show(index));
            dotsArea.appendChild(dot);
            return dot;
        });

        function show(index) {
            current = (index + slides.length) % slides.length;
            line.style.transform = `translateX(-${current * 100}%)`;
            dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === current));
            restart();
        }

        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(() => show(current + 1), 3000);
        }

        slider.querySelector("[data-slider-prev]").addEventListener("click", () => show(current - 1));
        slider.querySelector("[data-slider-next]").addEventListener("click", () => show(current + 1));
        show(0);
    });
}

function render() {
    state = loadState();
    renderNav();
    const hash = window.location.hash.replace(/^#/, "") || "/";
    const [path] = hash.split("?");
    const [, reviewId] = path.match(/^\/review\/(\d+)$/) || [];

    if (path === "/") {
        routeTo(homeRoute());
    } else if (reviewId) renderReview(reviewId);
    else if (path === "/register") renderRegister();
    else if (path === "/cabinet") renderCabinet();
    else if (path === "/request") renderRequestForm();
    else if (path === "/admin") renderAdmin();
    else renderLogin();
}

window.addEventListener("hashchange", render);
document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-link]");
    if (!link) return;
    event.preventDefault();
    routeTo(link.getAttribute("href").replace(/^#/, ""));
});

render();
