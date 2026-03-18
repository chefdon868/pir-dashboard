const [xlsxReady, setXlsxReady] = useState(false);

useEffect(() => {
  const checkXLSX = () => {
    if (typeof window !== 'undefined' && window.XLSX) {
      setXlsxReady(true);
    } else {
      setTimeout(checkXLSX, 100);
    }
  };
  checkXLSX();
}, []);

const handleFileUpload = (e) => {
  if (!xlsxReady) {
    alert('XLSX library still loading. Please wait a moment and try again.');
    return;
  }
  // ... rest of file handling
};