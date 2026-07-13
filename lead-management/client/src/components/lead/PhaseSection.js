import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from '../UI/Card';
export function PhaseSection({ id, title, noCard = false, children }) {
    return (_jsx("section", { id: id, className: "scroll-mt-28", role: "tabpanel", "aria-labelledby": `${id}-title`, children: noCard ? (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "px-4 py-2 bg-slate-100/50 rounded-lg border border-slate-200/40", children: _jsx("h2", { id: `${id}-title`, className: "text-xs font-bold text-gray-700 uppercase tracking-wider", children: title }) }), children] })) : (_jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsx("h2", { id: `${id}-title`, className: "text-lg font-bold text-gray-900 mb-4 pb-2 border-b", children: title }), children] }) })) }));
}
