import Layout from "./Layout.jsx";

import ShadowWars from "./ShadowWars";

import Clans from "./Clans";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    
    ShadowWars: ShadowWars,
    
    Clans: Clans,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    //const location = useLocation();
    //const currentPage = _getCurrentPage(location.pathname);
    
    return (
        //<Layout currentPageName={currentPage}>

        
        <Routes>
        <Route path="/:id?" element={<Layout />}>
            <Route index element={<ShadowWars />} />
            <Route path="war" element={<ShadowWars />} />
            <Route path="clans" element={<Clans />} />
        </Route>
        </Routes>
    );
}

export default function Pages() {
    return (
        //<Router>
            <PagesContent />
        //</Router>
    );
}