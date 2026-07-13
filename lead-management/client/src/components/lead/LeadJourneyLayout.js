import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function LeadJourneyLayout({ topNavbar, actionBar, phaseNavbar, content, timeline }) {
    return (_jsxs("div", { 
        className: "-mx-6 -mt-6 md:-mx-8 md:-mt-8 flex flex-col w-full h-auto font-sans text-gray-900", 
        children: [
            _jsxs("div", {
                className: "sticky top-0 z-50 w-full shrink-0 flex flex-col",
                children: [topNavbar, actionBar, phaseNavbar]
            }),
            _jsx("div", { 
                className: "flex-1 w-full mx-auto max-w-7xl mt-6 px-6 md:px-8 pb-8", 
                children: _jsxs("div", { 
                    className: "grid grid-cols-1 lg:grid-cols-3 gap-6 items-start", 
                    children: [
                        _jsx("div", { className: "lg:col-span-2 space-y-8", children: content }), 
                        _jsx("div", { 
                            className: "lg:col-span-1 bg-slate-50 p-6 rounded-xl border border-gray-100 shadow-2xs", 
                            children: timeline 
                        })
                    ] 
                }) 
            })
        ] 
    }));
}
