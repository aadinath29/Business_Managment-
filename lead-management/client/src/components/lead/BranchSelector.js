import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
export function BranchSelector() {
    const { currentBranchId, setCurrentBranchId, branches, currentBranch } = useBranch();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (_jsxs("div", { className: "relative", ref: dropdownRef, children: [_jsxs("div", { className: "flex flex-col items-end", children: [_jsx("span", { className: "text-[10px] uppercase tracking-wider text-gray-400 font-bold leading-none mb-1", children: "Current Branch" }), _jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "flex items-center space-x-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer", "aria-haspopup": "listbox", "aria-expanded": isOpen, children: [_jsx(MapPin, { className: "h-4 w-4 text-blue-500" }), _jsx("span", { children: currentBranch?.name || 'All Branches' }), _jsx(ChevronDown, { className: `h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}` })] })] }), isOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 z-50 py-1 transition-all", children: [_jsx("div", { className: "px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50", children: "Switch Branch" }), _jsxs("button", { onClick: () => {
                            setCurrentBranchId('all');
                            setIsOpen(false);
                        }, className: `flex items-center justify-between w-full px-4 py-2 text-left text-sm transition-colors cursor-pointer ${currentBranchId === 'all'
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'}`, children: [_jsx("span", { children: "All Branches" }), currentBranchId === 'all' && _jsx(Check, { className: "h-4 w-4 text-blue-600" })] }), branches.map((b) => (_jsxs("button", { onClick: () => {
                            setCurrentBranchId(b.id);
                            setIsOpen(false);
                        }, className: `flex items-center justify-between w-full px-4 py-2 text-left text-sm transition-colors cursor-pointer ${currentBranchId === b.id
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'}`, children: [_jsx("span", { children: b.name }), currentBranchId === b.id && _jsx(Check, { className: "h-4 w-4 text-blue-600" })] }, b.id)))] }))] }));
}
