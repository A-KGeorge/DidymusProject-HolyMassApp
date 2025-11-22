// // import './App.css'

// // // Main App component
// // function App() {
// //   return (
// //     <>
// //       <p>Hello world</p>
// //       <Text /> {/* Using the Text component below */}
// //     </>
// //   )
// // }

// // // Creating a new component named "Text"
// // function Text() {
// //   return (
// //     <>
// //     <div>
// //       <p>Hello bro</p>
// //     </div>
// //     </>
// //   )
// // }

// // export default App

// // Code should be written inside components like App or other reusable components
// // src/App.tsx
// // import React from 'react';
// // import PrayerList from './components/PrayerList';

// // const App: React.FC = () => {
// //   return (
// //     <div>
// //       <PrayerList />
// //     </div>
// //   );
// // };

// // export default App;
// // src/App.tsx
// // import React from 'react';
// // import PrayerList from './Components/PrayerList';
// // // import PrayerList from './Components'; 

// // const App: React.FC = () => {
// //   return (
// //     <div>
// //       <PrayerList />
// //     </div>
// //   );
// // };

// // export default App;
// // src/App.tsx
// // import React, { useEffect, useState } from 'react';
// // import prayersData from './assets/prayers.json';

// // interface Prayer {
// //   id: number;
// //   title: string;
// //   content: string;
// // }

// // const App: React.FC = () => {
// //   const [prayers, setPrayers] = useState<Prayer[]>([]);

// //   useEffect(() => {
// //     fetch('/assets/prayers.json')
// //       .then(response => response.json())
// //       .then(data => setPrayers(data))
// //       .catch(error => console.error('Failed to load prayers:', error));
// //   }, []);

// //   return (
// //     <div style={{ padding: '20px' }}>
// //       <h1>Holy Mass Prayers</h1>
// //       {prayers.length === 0 ? (
// //         <p>Loading...</p>
// //       ) : (
// //         prayers.map(prayer => (
// //           <div key={prayer.id} style={{ marginBottom: '20px' }}>
// //             <h2>{prayer.title}</h2>
// //             <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
// //               {prayer.content}
// //             </p>
// //           </div>
// //         ))
// //       )}
// //     </div>
// //   );
// // };

// // export default App;

// import React, { useState, useEffect } from 'react';
// import prayersData from './assets/prayers1.json'; // ✅ Import it

// interface Prayer {
//   id: number;
//   title: string;
//   content: string;
// }

// const App: React.FC = () => {
//   const [prayers, setPrayers] = useState<Prayer[]>([]);

//   useEffect(() => {
//     setPrayers(prayersData); // ✅ No fetch needed
//   }, []);

//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>Holy Mass Prayers</h1>
//       {prayers.map(prayer => (
//         <div key={prayer.id} style={{ marginBottom: '20px' }}>
//           <h2>{prayer.title}</h2>
//           <p style={{ whiteSpace: 'pre-wrap' }}>{prayer.content}</p>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default App;
// import React, { useState, useEffect } from 'react';
// import prayersJson from './assets/prayers1.json';

// interface Prayer {
//   id: string;
//   title?: string;
//   malayalamText: string;
//   englishText?: string;
// }

// const App: React.FC = () => {
//   const [prayers, setPrayers] = useState<Prayer[]>([]);

//   useEffect(() => {
//     const parsed = parsePrayers(prayersJson);
//     setPrayers(parsed);
//   }, []);

//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>Holy Mass Prayers</h1>
//       {prayers.map(prayer => (
//         <div key={prayer.id} style={{ marginBottom: '20px' }}>
//           {prayer.title && <h2>{prayer.title}</h2>}
//           <p style={{ whiteSpace: 'pre-wrap' }}>{prayer.malayalamText}</p>
//           {prayer.englishText && <p><i>{prayer.englishText}</i></p>}
//         </div>
//       ))}
//     </div>
//   );
// };

// function parsePrayers(data: any): Prayer[] {
//   const prayersObj = data.mass["preface-announcement"];
//   const prayers: Prayer[] = [];

//   for (const key in prayersObj) {
//     const prayer = prayersObj[key];

//     prayers.push({
//       id: key,
//       title: prayer.title?.malayalam,
//       malayalamText: prayer.malayalam?.text || "",
//       englishText: prayer.english?.text,
//     });
//   }

//   return prayers;
// }

// export default App;
// src/App.tsx
import React from 'react';
import PrayerList from './Components/PrayerList';

const App: React.FC = () => {
  return (
    <div>
      <PrayerList />
    </div>
  );
};

export default App;
