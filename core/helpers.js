export const uuid = () =>
    globalThis.crypto?.randomUUID?.() ||
    `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const capitalize = (value) => {
    const text = String(value ?? "");
    return text ? text[0].toUpperCase() + text.slice(1) : "";
};

export const debounce = (fn, delay = 300) => {
    if (typeof fn !== "function") throw new TypeError("fn deve ser uma função.");
    let timer = null;
    const debounced = (...args) => {
        globalThis.clearTimeout(timer);
        timer = globalThis.setTimeout(() => fn(...args), Math.max(0, Number(delay) || 0));
    };
    debounced.cancel = () => {
        globalThis.clearTimeout(timer);
        timer = null;
    };
    return debounced;
};
