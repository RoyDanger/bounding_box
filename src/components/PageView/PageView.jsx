import React, { useEffect, useState } from 'react';
import BackgroundButton from '../BackgroundButton/BackgroundButton';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { MdOutlineArrowCircleLeft, MdOutlineArrowCircleRight } from "react-icons/md";
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MdKeyboardBackspace } from "react-icons/md";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();

const options = {
    cMapUrl: '/cmaps/',
    standardFontDataUrl: '/standard_fonts/',
};

const pagesPerRow = 6;

const PageView = () => {
    const [file, setFile] = useState(null);
    const [numPages, setNumPages] = useState();
    const [containerRef, setContainerRef] = useState(null);
    const [containerWidth, setContainerWidth] = useState();
    const [currentPage, setCurrentPage] = useState(1);
    const [largePage, setLargePage] = useState(null);
    const [singlePageView, setSinglePageView] = useState(false);
    const [isAddingArea, setIsAddingArea] = useState(false);
    const [rectangles, setRectangles] = useState([]);
    const [rectanglesScrollPoints, setRectanglesScrollPoints] = useState([]);
    const [rectanglesScrollPointsX, setRectanglesScrollPointsX] = useState([]);
    const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
    const [endPosition, setEndPosition] = useState({ x: 0, y: 0 });
    const [selectedRectangle, setSelectedRectangle] = useState(null);
    const [canvasSize,setCanvasSize] = useState({x:0,y:0,width:0,height:0});
    const [outputData,setOutputData] = useState({canvasSizeOutput:{x:0,y:0,width:0,height:0},PID:0,BoundingBoxId:0,selectedArea:{x:0,y:0,width:0,height:0}});
    const [PID, setPID] = useState(0);
    const [BoundingBoxId, setBoundingBoxId] = useState(1);
    const [handleEditFlag,setHandleEditFlag] = useState(false);
    const [ handleEditXY,setHandleEditXY] = useState({x:0,y:0});
    const [editRectangleActiveIndex,setEditRectangleActiveIndex] = useState(-1);
    const [handleClickCount,setHandleClickCount] = useState(0);
    const [scrollFixed, setScrollFixed] = useState(0);
    const [handleEditFlag1,setHandleEditFlag1] = useState(false);
    const [displayedPageRange, setDisplayedPageRange] = useState('');
    const [pageCanvases, setPageCanvases] = useState({});
    const [boundingBoxIds,setBoundingBoxIds] = useState([]);

    const[pageNumbers,setPageNumbers] = useState([]);

    // State to hold the rectangle being drawn
    const [drawingRectangle, setDrawingRectangle] = useState({x: 0,y: 0,width: 0,height: 0});

    useEffect(() => {
        const handleMouseMove = (event) => {
            console.log('Mouse Position: ', {x: event.clientX, y: event.clientY}, "selected rectangle::",rectangles);
        };
    
        window.addEventListener('mousemove', handleMouseMove);
    
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [rectangles]); // Empty dependency array to run the effect only once
    


    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const [entry] = entries;

            if (entry) {
                setContainerWidth(entry.contentRect.width);
            }
        });

        if (containerRef) {
            observer.observe(containerRef);
        }

        return () => observer.disconnect();
    }, [containerRef]);

    // Update PID when the current page changes
    useEffect(() => {
        setPID(currentPage);
    }, [currentPage,pageCanvases,boundingBoxIds]);


    useEffect(() => {
        if (outputData.x +outputData.y+outputData.width+outputData.height !== 0 & outputData.canvasSizeOutput.x+outputData.canvasSizeOutput.y+outputData.canvasSizeOutput.width+outputData.canvasSizeOutput.height !== 0){
                generateTxtFileFromObject(selectedRectangle,canvasSize);
                setOutputData({canvasSizeOutput:{x:0,y:0,width:0,height:0},PID:0,BoundingBoxId:0,selectedArea:{x:0,y:0,width:0,height:0}});
        }
      }, [canvasSize,outputData]);

    function onFileChange(event) {
        const { files } = event.target;

        if (files && files[0]) {
            setFile(files[0] || null);
        }
    }

    function onDocumentLoadSuccess({ numPages: nextNumPages }) {
        setNumPages(nextNumPages);
    }

    useEffect(() => {
        // Calculate the range of pages displayed based on the current view
        if (singlePageView) {
            setDisplayedPageRange(`${currentPage} / ${numPages} pages`);
        } else {
            let startPage = (Math.ceil(currentPage / pagesPerRow) - 1) * pagesPerRow + 1;
            let endPage = Math.min(startPage + pagesPerRow - 1, numPages);
            setDisplayedPageRange(`${startPage}-${endPage} / ${numPages} pages`);
        }
    }, [currentPage, numPages, singlePageView]);


    const handleAddPage = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf';
        fileInput.onchange = handleFileChange;
        fileInput.click();
    };

    const handleAddArea = () => {
        if (file.name.length > 0){
            setIsAddingArea(true);
        }
    };

    const generateId = () => {
        if (boundingBoxIds.length < 1) {
            setBoundingBoxIds(prevBoundingBoxIds => [...prevBoundingBoxIds, 1]);
        } else {
            const id = boundingBoxIds[boundingBoxIds.length - 1] + 1;
            setBoundingBoxIds(prevBoundingBoxIds => [...prevBoundingBoxIds, id]);
        }
    }

    const hadleEditOnClick = (e) => {
        if (handleEditFlag){
            setIsAddingArea(true);
        }
        // console.log("coordinates::",e.clientX,e.clientY)
        // console.log("click button Edditing",handleClickCount);
        if (handleEditFlag1){
            const a = handleClickCount + 1;
            setHandleClickCount(a);
        }
        if (handleClickCount >= 1 && handleEditFlag1){
            setHandleEditFlag1(false);
            setHandleClickCount(0);
            const pageCanvas = document.querySelector('.react-pdf__Page__canvas');
            const d = pageCanvas.getBoundingClientRect();
            const updatedRectangles = rectangles.map((rect, index) => {
                if (index === editRectangleActiveIndex) {
                    const newRectangle = {
                        x: rect.x,
                        y: rect.y,
                        width: selectedRectangle.x-rect.x,
                        height: selectedRectangle.y-rect.y,
                    };
                    return newRectangle;
                } else {
                    return rect;
                }
            });
            const filteredUpdatedRectangles = updatedRectangles.filter(rec => rec.width !== 0 && rec.height!==0);
            setRectangles(filteredUpdatedRectangles);
            setPageCanvases(prevState => ({
                ...prevState,
                [currentPage]: pageCanvas
            }));
            
            generateId();
            setPageNumbers(prevPageNumbers => {
                return prevPageNumbers.map((number, index) => {
                    if (index === editRectangleActiveIndex) {
                        // Replace the value at the specified index with currentPage
                        return currentPage;
                    } else {
                        // Keep the original value
                        return number;
                    }
                });
            });
            setEditRectangleActiveIndex(-1);
            setHandleEditFlag(false);
            setHandleEditFlag1(false);
            setIsAddingArea(false);
            setSelectedRectangle(filteredUpdatedRectangles[editRectangleActiveIndex]);
        }
        setHandleEditFlag(false);
        if (handleEditFlag === true && editRectangleActiveIndex !== undefined){
            const r = rectangles[editRectangleActiveIndex];
            if (r !== undefined){
                setDrawingRectangle(r);
            }
        }
    }

    const handleMouseDown = (e) => {
        console.log("Enter mouse down")
        if (isAddingArea) {
            // Disable text selection
            document.body.style.userSelect = 'none';

            setStartPosition({ x: e.clientX, y: e.clientY });
            setEndPosition({ x: e.clientX, y: e.clientY });
            setDrawingRectangle({
                x: e.clientX,
                y: e.clientY,
                width: 0, // Initial width set to 0
                height: 0 // Initial height set to 0
            });
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;

            setScrollFixed(scrollY);
            setRectanglesScrollPoints([...rectanglesScrollPoints,scrollY]);
        }
    };

    const handleMouseMove = (e) => {
        // console.log('Mouse Position: ', {x: e.clientX, y: e.clientY});
        if (handleEditFlag){
            setHandleEditXY({x: Math.abs(e.clientX), y: Math.abs(e.clientY) });
            const i = rectangles.map((rect, index) => {
                const xFlag = Math.abs(handleEditXY.x - rect.x) < 4;
                const yFlag = Math.abs(handleEditXY.y - rect.y) < 4;
                const xRightFlag = Math.abs(handleEditXY.x  - rect.x - rect.width) < 4;
                const yRightFlag = Math.abs(handleEditXY.y - rect.y - rect.height) < 4;
            
                let co = 0;
                if (xFlag === true) { co += 1; }
                if (yFlag === true) { co += 1; }
                if (yRightFlag === true) { co += 1; }
                if (xRightFlag === true) { co += 1; }
            
                if (co === 2) {
                    return index;
                }
            });

            const indicesWithCoTwo = i.filter(index => index !== undefined);
            setEditRectangleActiveIndex(indicesWithCoTwo[0]);
        
        }
        if (isAddingArea) {
            setEndPosition({ x: e.clientX, y: e.clientY });
            const updatedRectangle = {
                x: drawingRectangle.x,
                y: drawingRectangle.y,
                width: Math.abs(e.clientX - drawingRectangle.x),
                height: Math.abs(e.clientY - drawingRectangle.y)
            };
            setDrawingRectangle(updatedRectangle);
        }
    };

    const handleMouseUp = (e) => {
        if (isAddingArea && editRectangleActiveIndex === -1) {
            const newRectangle = {
                x: startPosition.x,
                y: startPosition.y,
                width: Math.abs(endPosition.x - startPosition.x),
                height: Math.abs(endPosition.y - startPosition.y),
            };
            if (newRectangle.x!==0 && newRectangle.y!==0){
                const pageCanvas = document.querySelector('.react-pdf__Page__canvas');
                setPageCanvases(prevState => ({
                    ...prevState,
                    [currentPage]: pageCanvas
                }));
                setRectangles([...rectangles, newRectangle]);
                setPageNumbers(prevPageNumbers => [...prevPageNumbers, currentPage]);
    
                generateId();
                setSelectedRectangle(newRectangle);

            }
            setStartPosition({ x: 0, y: 0 });
            setEndPosition({ x: 0, y: 0 });
            setDrawingRectangle({x: 0,
                y: 0,
                width: 0,
                height: 0});
            // Re-enable text selection
            document.body.style.userSelect = '';
        }else if (isAddingArea && editRectangleActiveIndex !== -1){
            const newRectangle = {
                x: startPosition.x,
                y: startPosition.y,
                width: Math.abs(endPosition.x - startPosition.x),
                height: Math.abs(endPosition.y - startPosition.y),
            };
            setRectangles([...rectangles, newRectangle]);
            const pageCanvas = document.querySelector('.react-pdf__Page__canvas');
            setPageCanvases(prevState => ({
                ...prevState,
                [currentPage]: pageCanvas
            }));
            // setPageNumbers(prevPageNumbers => [...prevPageNumbers, currentPage]);
            setPageNumbers(prevPageNumbers => {
                return prevPageNumbers.map((number, index) => {
                    if (index === editRectangleActiveIndex) {
                        // Replace the value at the specified index with currentPage
                        return currentPage;
                    } else {
                        // Keep the original value
                        return number;
                    }
                });
            });
            generateId();
            setSelectedRectangle(newRectangle);
            setStartPosition({ x: 0, y: 0 });
            setEndPosition({ x: 0, y: 0 });
            setDrawingRectangle({x: 0,
                y: 0,
                width: 0,
                height: 0});
        }
    };
    

    // Pass PID and BoundingBoxId to generateTxtFileFromObject function
    const handleGenerateImage = () => {
    if (selectedRectangle) {
        generateImage(); // Assuming generateImage updates state that triggers TXT file generation

        const pageIndicesMap = pageNumbers.reduce((acc, pageNumber, index) => {
            if (!acc[pageNumber]) {
                acc[pageNumber] = []; // Initialize an array for the pageNumber if it doesn't exist
            }
            acc[pageNumber].push(index); // Push the index to the corresponding pageNumber array
            return acc;
        }, {});

        const dpr = window.devicePixelRatio || 1; // Adjust for device pixel ratio

        const allData = {}

        for (const [pageNumber, indices] of Object.entries(pageIndicesMap)) {
            const c = pageCanvases[pageNumber].getBoundingClientRect()
            const a = indices.map((rectangleIndex, index) => {
                const rectangle = rectangles[rectangleIndex] 
                return {
                    PID: pageNumbers[rectangleIndex],
                    BoundingBoxId: boundingBoxIds[rectangleIndex],
                    // rectangle: {x: Math.abs(rectangle.x-c.x)*dpr, y:Math.abs(rectangle.y - c.y)*dpr, width: rectangle.width*dpr, height:rectangle.height*dpr},
                    rectangle
                };
            });
            const finalOutPut = {rectangles:a,containerSize:{x: c.x, y:c.y, width: c.width, height:c.height}};
            allData[pageNumber] = finalOutPut
        }

        generateTxtFileFromObject(allData);

        setEditRectangleActiveIndex(-1);
        setRectangles([]);
        setCanvasSize({});
        setPageCanvases([]);
        setPageNumbers([]);
        setBoundingBoxIds([])
        setDrawingRectangle({x: 0,y: 0,width: 0,height: 0});
        setHandleEditFlag1(false);
        setHandleEditXY({x:0,y:0});
        setSelectedRectangle(null);
        setRectanglesScrollPoints([]);
        setRectanglesScrollPointsX([]);
        setIsAddingArea(false);
    }
};
    

    const generatePDF = (pageNumber, rectangle) => {
        if (pageNumber && rectangle) {
            // Get the page container element
            const pageContainer = document.querySelector('.react-pdf__Page__textContent');

            // Check if the page container exists
            if (pageContainer) {
                // Convert HTML content to an image using html2canvas
                html2canvas(pageContainer).then(canvas => {
                    // Create a new jsPDF instance
                    const doc = new jsPDF();

                    // Add the image of the page content to the PDF
                    doc.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 10, 10, 190, 277);

                    // Save the PDF
                    doc.save(`page_${pageNumber}_coming_soon.pdf`);
                });
            } else {
                console.error('Page container not found.');
            }
        } else {
            console.error('Invalid page number or rectangle.');
        }
    };

    const generateTxtFileFromObject = (rectangleData) => {

        const textData = JSON.stringify({data:rectangleData}, null, 2);
    
        const blob = new Blob([textData], { type: 'text/plain' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download =  "file.txt";
    
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };
    

    const generateImage = () => {
        if (pageNumbers.length > 0 && rectangles.length > 0) {
            const pdf = new jsPDF();
            const pngDataUrls = {}; // Object to store PNG data URLs
    
            const pageIndicesMap = pageNumbers.reduce((acc, pageNumber, index) => {
                if (!acc[pageNumber]) {
                    acc[pageNumber] = []; // Initialize an array for the pageNumber if it doesn't exist
                }
                acc[pageNumber].push(index); // Push the index to the corresponding pageNumber array
                return acc;
            }, {});

            const cnavasPageN = Object.keys(pageCanvases).map(pageN=>{
                const n = parseInt(pageN,10);
                const canV = pageCanvases[n].getBoundingClientRect();
                if(canV.x > 0 && canV.y > 0){
                    return n;
                }else{
                    return null;
                }
            }).filter(item => item !== null);

            for (const [pageNumber, indices] of Object.entries(pageIndicesMap)) {
                const pageCanvas = pageCanvases[pageNumber];
                if (pageCanvas) {

                    const dpr = window.devicePixelRatio || 1;
                    // const canvasCo = pageCanvas.getBoundingClientRect();
    
                    const drawCanvas = document.createElement('canvas');
                    drawCanvas.width = pageCanvas.width * dpr;
                    drawCanvas.height = pageCanvas.height * dpr;
                    const ctx = drawCanvas.getContext('2d');
                    ctx.scale(dpr, dpr);
    
                    ctx.drawImage(pageCanvas, 0, 0);
    
                    indices.forEach(index => {
                        const pageCanvas1 = pageCanvases[cnavasPageN[0]];
                        const canvasCo = pageCanvas1.getBoundingClientRect();
                        const rectangle = rectangles[index];
                        const { x, y, width, height } = rectangle;
    
                        ctx.strokeStyle = 'blue';
                        ctx.lineWidth = 2;
    
                        if (rectanglesScrollPoints[index] === 0) {
                            ctx.strokeRect(Math.abs(x - canvasCo.x) * dpr, Math.abs(y - canvasCo.y - scrollY) * dpr, width * dpr, height * dpr);
                        } else {
                            // console.log("page number1::",pageNumber);
                            ctx.strokeRect(Math.abs(x - canvasCo.x) * dpr, Math.abs(y - canvasCo.y - scrollY + rectanglesScrollPoints[index]) * dpr, width * dpr, height * dpr);
                        }
                    });
    
                    // Convert drawing canvas to PNG data URL
                    pngDataUrls[pageNumber] = drawCanvas.toDataURL('image/png');
                } else {
                    console.error(`Page canvas not found for page ${pageNumber}.`);
                }
            }
    
            // Generate PDF from PNG data URLs
            const generatePdfFromPngDataUrls = () => {
                Object.keys(pngDataUrls).forEach((pageNumber, index) => {
                    if (index > 0) {
                        pdf.addPage();
                    }
                    // Adjust dimensions as needed
                    pdf.addImage(pngDataUrls[pageNumber], 'PNG', 0, 0, 210, 297);
                });
    
                pdf.save('document_with_rectangles.pdf');
            };
    
            // Call function to generate PDF from PNG data URLs
            generatePdfFromPngDataUrls();
        } else {
            console.error('Invalid page number or rectangles.');
        }
    };
    
    
    

    

    const containerStyle = {
        userSelect: 'none',
        cursor: isAddingArea ? 'crosshair' : 'auto',
        overflow: 'visible', // Allow scrolling within the container
        border: '2px solid red',
        position: 'relative',
    };

    // Adjust rendering scale based on container size if necessary
    const scale = 0.99; // Adjust based on container size and PDF page dimensions if needed


    const handleDeletePage = () => {
        // Code to delete the selected page
        setFile(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFile(file);
    };

    const handlePreviousPage = () => {
        // In single page view, move one page back
        if (singlePageView) {
            setCurrentPage(Math.max(1, currentPage - 1));
        } else {
            // In thumbnail view, jump pagesPerRow pages back
            setCurrentPage(Math.max(1, currentPage - pagesPerRow));
        }
        // console.log("CurrentPage",currentPage);
        // Clear selected rectangles when moving to a different page
        // setRectangles([]);
        // setSelectedRectangle(null); // Clear selection when changing page
    };
    
    const handleNextPage = () => {
        // In single page view, move one page forward
        if (singlePageView) {
            setCurrentPage(Math.min(numPages, currentPage + 1));
        } else {
            // In thumbnail view, jump pagesPerRow pages forward
            setCurrentPage(Math.min(numPages, currentPage + pagesPerRow));
        }
        // Clear selected rectangles when moving to a different page
        // setRectangles([]);
        // setSelectedRectangle(null); // Clear selection when changing page
    };

    const handleBack = () =>{
            setSinglePageView(false);
            const thumbnailPage = Math.ceil(currentPage / pagesPerRow);
            setCurrentPage(thumbnailPage);
    }


    const handleThumbnailClick = (pageNumber) => {
        setCurrentPage(pageNumber);
        setSinglePageView(true);
    };
    

    const renderPages = () => {
        if (!numPages) return null;
    
        let startIndex, endIndex;

        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        // console.log("scrollbar::",scrollX,scrollY);
    
        if (singlePageView) {
            // Detailed view for a single page
            return (
                <div style={containerStyle} onDoubleClick={() => setSinglePageView(false)}
                     onMouseDown={handleMouseDown}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                     onClick={hadleEditOnClick}>
                    <Document file={file} onLoadSuccess={onDocumentLoadSuccess} options={options}>
                        <Page pageNumber={currentPage} scale={scale} />
                    </Document>
                    {renderRectangles()}
                </div>
            );
        } else {
            // Thumbnail view for browsing pages
            const pageCount = Math.ceil(numPages / pagesPerRow);
            startIndex = (currentPage - 1) * pagesPerRow;
            endIndex = Math.min(startIndex + pagesPerRow, numPages);

            return (
                <div className="thumbnails-container" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10px' }}> {/* Adjusted to include gap */}
                    {Array.from({ length: endIndex - startIndex }, (_, index) => {
                        const pageNumber = startIndex + index + 1;
                        return (
                            <div key={`thumbnail_${pageNumber}`} className="thumbnail" onDoubleClick={() => handleThumbnailClick(pageNumber)} style={{ border: '2px solid #ccc', cursor: 'pointer', padding: '4px', userSelect: 'none' }}> {/* Added inline styles */}
                                <Page pageNumber={pageNumber} width={200} />
                            </div>
            );
        })}
    </div>
            );
        }
    };

    const handleEdit = (e) =>{
        setHandleEditFlag(true);
        setHandleEditFlag1(true);
    }
    
    
    
    

    // CSS styles for rectangles
    const rectangleStyle = {
        position: 'absolute',
        border: '2px solid blue', // Adjust border properties as needed
    };

    const [scrollX, setScrollX] = useState(window.pageXOffset || document.documentElement.scrollLeft);
    const [scrollY, setScrollY] = useState(window.pageYOffset || document.documentElement.scrollTop);
    const [prevScrollY, setPrevScrollY] = useState(scrollY); // State for previous scrollY

  
    // const pageCanvas = document.querySelector('.react-pdf__Page__canvas');
  
    useEffect(() => {
        const updatePositions = () => {
          const newScrollX = window.pageXOffset || document.documentElement.scrollLeft;
          const newScrollY = window.pageYOffset || document.documentElement.scrollTop;
    
          // Update scroll positions and calculate direction (optional)
          setScrollX(newScrollX);
          setPrevScrollY(scrollY);
          setScrollY(newScrollY);
        };
    
        window.addEventListener('scroll', updatePositions);
    
        // Cleanup function to remove event listener on unmount
        return () => window.removeEventListener('scroll', updatePositions);
      }, [scrollX,scrollY,prevScrollY,scrollFixed,rectanglesScrollPoints,handleEditXY,editRectangleActiveIndex,handleClickCount,handleEditFlag1]);

    const renderRectangles = () => {
        const pageCanvas = document.querySelector('.react-pdf__Page__canvas');
        if (pageCanvas) {
            const canvasPage = pageCanvas.getBoundingClientRect();
            return (
                <>
                    {rectangles.map((rect, index) => (
                        (editRectangleActiveIndex !== index) && (rect.width>0 && rect.height > 0) && (pageNumbers[index]===currentPage) &&  // Conditionally render based on index
                        <div
                            key={`rect_${index}`}
                            className="rectangle"
                            style={{
                                position: 'absolute',
                                border: '2px solid blue', // Adjust border properties as needed
                                left: `${Math.abs(rect.x - canvasPage.x - scrollX)}px`,
                                top: (rectanglesScrollPoints[index] === 0 ? `${rect.y - canvasPage.y - scrollY}px` : `${rect.y - canvasPage.y - scrollY + rectanglesScrollPoints[index]}px`),
                                width: `${rect.width}px`,
                                height: `${rect.height}px`,
                            }}
                        />
                    ))}


                    {isAddingArea && drawingRectangle.x!==0 && drawingRectangle.y!==0  && (
                        <div
                            className="rectangle"
                            style={{
                                position: 'absolute',
                                border: '2px solid blue', // Adjust border properties as needed
                                left: `${Math.abs(drawingRectangle.x- canvasPage.x)}px`,
                                top: `${Math.abs(drawingRectangle.y- canvasPage.y)}px`,
                                width: `${drawingRectangle.width}px`,
                                height: `${drawingRectangle.height}px`,
                            }}
                        />
                    )}
                </>
            );
        }
    };
    

    const observer = new ResizeObserver((entries) => {
        const [entry] = entries;
    
        if (entry) {
            const pageCanvas = document.querySelector('.react-pdf__Page__canvas');
            if (pageCanvas){
                const containerRect = containerRef.getBoundingClientRect();
                setCanvasSize({
                    x: containerRect.left,
                    y: containerRect.top,
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        }
    });
    
    if (containerRef) {
        observer.observe(containerRef);
    };
    

    return (
        <div id='maincontainer'className='mt-8 mx-8' style={{border: '2x solid black'}}>
            <div className="flex justify-around items-center">
            <MdKeyboardBackspace size={36} onClick={handleBack}/>
                <div className='flex justify-start gap-8'>
                    <BackgroundButton Text={"Add Page"} onClick={handleAddPage} />
                    <BackgroundButton Text={"+ Add Area"} onClick={handleAddArea} />
                    <BackgroundButton Text={"Generate PDF"} onClick={handleGenerateImage} />
                    <BackgroundButton Text={"Edit"} onClick={handleEdit} />
                </div>
                <BackgroundButton Text={"Delete"} onClick={handleDeletePage} />
            </div>
            <div className="mt-20 mx-12" style={{border: '2x solid blue'}}>
                <div className="mt-4">
                    <div className='mt-8 mx-8'>
                        <div className="Example__container__document" ref={setContainerRef}>
                            <Document file={file} onLoadSuccess={onDocumentLoadSuccess} options={options} className="flex flex-wrap mx-auto justify-center">
                                {renderPages()}
                            </Document>
                        </div>
                        {file && (
                            <div className="mt-4 flex justify-center gap-10">
                                <MdOutlineArrowCircleLeft
                                    className={`cursor-pointer ${currentPage === 1 ? 'opacity-50' : ''}`}
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    size={50}
                                />
                                {/* Displaying the current page range and total pages */}
                                <span>{displayedPageRange}</span>
                                <MdOutlineArrowCircleRight
                                    className={`cursor-pointer ${currentPage === numPages ? 'opacity-50' : ''}`}
                                    onClick={handleNextPage}
                                    disabled={currentPage === numPages}
                                    size={50}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PageView;
