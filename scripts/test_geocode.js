import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function testGeocode() {
    const token = process.env.VITE_MAPBOX_TOKEN;
    const searchAddress = "4 rue rosetti Nice";

    const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(searchAddress)}&access_token=${token}&limit=1`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

testGeocode();
