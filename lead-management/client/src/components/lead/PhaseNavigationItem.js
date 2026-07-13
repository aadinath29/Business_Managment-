import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Check, Pause } from 'lucide-react';
export function PhaseNavigationItem({ id, label, marker, status, isActiveTab, elementRef, onClick, onKeyDown }) {
    const getColors = () => {
        if (isActiveTab) {
            return {
                bg: 'bg-blue-600',
                text: 'text-white font-bold',
                border: 'border-blue-700 shadow-md',
                dot: 'bg-white',
                icon: _jsx("span", { className: "w-2 h-2 rounded-full bg-blue-600 animate-ping" })
            };
        }
        const isCompleted = status === 'completed' || status === 'success';
        const isLost = status === 'lost';
        const isOnHold = status === 'onhold';
        return {
            bg: 'bg-white',
            text: 'text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-50',
            border: 'border-slate-200',
            dot: 'bg-slate-200',
            icon: isCompleted ? _jsx(Check, { className: "w-3 h-3 text-slate-400" }) :
                isLost ? _jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-rose-500" }) :
                    isOnHold ? _jsx(Pause, { className: "w-2 h-2 text-amber-500" }) :
                        null
        };
    };
    const style = getColors();
    return (_jsxs("button", { ref: elementRef, onClick: onClick, onKeyDown: onKeyDown, role: "tab", "aria-selected": isActiveTab, "aria-controls": `panel-${id}`, className: `flex items-center space-x-2.5 px-4 py-2 text-xs rounded-full border transition-all duration-200 shrink-0 cursor-pointer snap-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isActiveTab ? 'ring-2 ring-blue-500/30' : ''} ${style.bg} ${style.text} ${style.border}`, children: [_jsx("span", { className: `w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-xs ${status === 'active' ? 'bg-white text-blue-600' : 'bg-slate-200/50'}`, children: style.icon ? style.icon : marker }), _jsx("span", { className: "whitespace-nowrap", children: label })] }));
}
