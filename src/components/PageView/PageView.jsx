import React, { useEffect, useState, useCallback, Component } from 'react';
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
import './PageView.css'
import CustomErrorBoundary from './CustomErrorBoundary';
import Notification from './Notification';

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
    const [isLoading, setIsLoading] = useState (true);
    const [pageNumbers,setPageNumbers] = useState([]);
    const [drawingRectangle, setDrawingRectangle] = useState({x: 0,y: 0,width: 0,height: 0});
    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedForEdit, setSelectedForEdit] = useState(null);
    const [isResizing,setIsResizing] = useState(false);
    const [resizingCursor,setResizingCursor] = useState(null);
    const [isDelete,setIsDelete] = useState(false);
    const [isDeleteCursor,setIsDeleteCursor] = useState(false);
    const[deleteIndex,setDeleteIndex] = useState(-1);
    const [clickCount, setClickCount] = useState(0);
    const [deleteModeMessage, setDeleteModeMessage] = useState("");
    const [editModeMessage, setEditModeMessage] = useState("");
    const [addAreaMessage, setAddAreaMessage] = useState("");


    useEffect(() => {
        const handleMouseMove = (event) => {
            // console.log('Mouse Position: ', {x: event.clientX, y: event.clientY},"rectangles::"+rectangles);
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

    const onDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }) => {
        setNumPages(nextNumPages);
        setIsLoading(false); 
    }, []);

    useEffect(() => {
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
        if (handleEditFlag) {
            // alert("Finish editing before adding an area.");
            setEditModeMessage("Edit mode active. Finish editing or Press 'Edit' again.");
            setTimeout(() => {
                setEditModeMessage("");
            }, 2000);
            return;
        }
        if (isDelete) {
            setDeleteModeMessage("Delete Rectangle mode active. Delete or click 'Delete Rectangle' to deactivate.");
            setTimeout(() => {
                setDeleteModeMessage("");
            }, 2000);
            return;
        }

        setClickCount(prevCount => {
            // Calculate the new count
            const newCount = prevCount + 1;

            if (newCount % 3 === 0) { // Disables on the third click
                setIsAddingArea(false);
                console.log("Adding area disabled.");
                setAddAreaMessage("Adding area disabled. Double click to activate again");
                resetAllStates();
                setTimeout(() => {
                    setAddAreaMessage("");
                }, 2000); //5 sec
            } else if (newCount % 3 === 1) { // Message for the next possible click
                setAddAreaMessage("Click again to activate Add Area.");
                setTimeout(() => {
                    setAddAreaMessage("");
                }, 2000); //5 sec
            } else if (newCount % 3 === 2) { // Enables on the second click
                setIsAddingArea(true);
                console.log("Adding area enabled.");
                setAddAreaMessage("Adding area enabled.");
                setTimeout(() => {
                    setAddAreaMessage("");
                }, 2000); 
            }
            return newCount;
        });
    };

    const handleGenerateImage = () => { // Pass PID and BoundingBoxId to generateTxtFileFromObject function

        if (handleEditFlag) {
            setEditModeMessage("Edit mode active. Finish editing or Press 'Edit' again.");
            setTimeout(() => {
                setEditModeMessage("");
            }, 3000);
            return;
        }
        if (isDelete) {
            setDeleteModeMessage("Delete Rectangle mode active. Delete or click 'Delete Rectangle' to deactivate.");
            setTimeout(() => {
                setDeleteModeMessage("");
            }, 3000);
            return;
        }
    if (rectangles.length>0) {
        console.log(rectangles,pageNumbers,pageCanvases);
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
    
            const cnavasPageN = Object.keys(pageCanvases).map(pageN => {
                const n = parseInt(pageN, 10);
                const canV = pageCanvases[n].getBoundingClientRect();
                return canV.x > 0 && canV.y > 0 ? n : null;
            }).filter(item => item !== null);
    
            for (const [pageNumber, indices] of Object.entries(pageIndicesMap)) {
                const pageCanvas = pageCanvases[pageNumber];
                if (pageCanvas) {
                    const dpr = window.devicePixelRatio || 1;
    
                    const drawCanvas = document.createElement('canvas');
                    drawCanvas.width = pageCanvas.width * dpr;
                    drawCanvas.height = pageCanvas.height * dpr;
                    const ctx = drawCanvas.getContext('2d');
                    ctx.scale(dpr, dpr);
                    ctx.drawImage(pageCanvas, 0, 0);
    
                    indices.forEach(index => {
                        const pageCanvas1 = pageCanvases[cnavasPageN[0]];
                        if (pageCanvas1) {
                            const canvasCo = pageCanvas1.getBoundingClientRect();
                            const rectangle = rectangles[index];
                            const { x, y, width, height } = rectangle;
    
                            ctx.strokeStyle = 'blue';
                            ctx.lineWidth = 2;
    
                            if (rectanglesScrollPoints[index] === 0) {
                                ctx.strokeRect(Math.abs(x - canvasCo.x) * dpr, Math.abs(y - canvasCo.y - scrollY) * dpr, width * dpr, height * dpr);
                            } else {
                                ctx.strokeRect(Math.abs(x - canvasCo.x) * dpr, Math.abs(y - canvasCo.y - scrollY + rectanglesScrollPoints[index]) * dpr, width * dpr, height * dpr);
                            }
                        }
                    });
    
                    const imageData = drawCanvas.toDataURL('image/png');
                    pngDataUrls[pageNumber] = imageData.split(',')[1];
                } else {
                    console.error(`Page canvas not found for page ${pageNumber}.`);
                }
            }
    
            const generatePdfFromPngDataUrls = () => {
                Object.keys(pngDataUrls).forEach((pageNumber, index) => {
                    if (index > 0) {
                        pdf.addPage();
                    }
                    const imageData = atob(pngDataUrls[pageNumber]);
                    pdf.addImage(imageData, 'PNG', 0, 0, 210, 297);
                });
                pdf.save('document_with_rectangles.pdf');
            };
    
            setTimeout(generatePdfFromPngDataUrls, 20);
        } else {
            console.error('Invalid page number or rectangles.');
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
         
    const handleEdit = () => {
        if (isDelete) {
            setDeleteModeMessage("Delete Rectangle mode active. Delete or click 'Delete Rectangle' to deactivate.");
            setTimeout(() => {
                setDeleteModeMessage("");
            }, 2000);
            return;
        }
        // Toggle the edit flag to enable or disable edit mode
        setHandleEditFlag(current => !current);  // This toggles the state
        setHandleEditFlag1(current => !current); // Assuming handleEditFlag1 also needs to be toggled similarly
        setIsAddingArea(false);
        setSelectedRectangle(null);          
        setIsResizing(true);                // Ensure resizing is turned off
        setEditRectangleActiveIndex(-1);
        if (!handleEditFlag) {
            // Code to handle when entering edit mode
            console.log("Entered edit mode");
            setEditModeMessage("Entered edit mode");
            setTimeout(() => {
                setEditModeMessage("");
            }, 2000);
    
        } else {
            // Code to handle when exiting edit mode
            console.log("Exited edit mode");
            setEditModeMessage("Edit mode is deactivated.");
            setTimeout(() => {
                setEditModeMessage("");
            }, 2000); //5 sec
            resetAllStates();  // Ensure all states are reset when exiting edit mode
        }
    };

    const handleEditOnClick = (e) => {
        if (isDelete) {
            const index = deleteIndex;
            console.log("rectangles before deletion", rectangles);
            console.log("delete index:", deleteIndex);
    
            rectangles.splice(index, 1);
            rectanglesScrollPoints.splice(index, 1);
            rectanglesScrollPointsX.splice(index, 1);
            pageNumbers.splice(index, 1);
    
            console.log("rectangles after deletion", rectangles);
            console.log("pageNumbers:", pageNumbers);
    
            // Filter and reset page canvases if necessary
            let filteredPageCanvas = Object.fromEntries(
                Object.entries(pageCanvases).filter(([key, _]) => pageNumbers.includes(parseInt(key)))
            );
            setPageCanvases(filteredPageCanvas);
    
            // Reset adding area state to false after deletion
            setIsAddingArea(false);
            setIsDelete(false);  // Optionally reset delete mode as well here
            setIsResizing(false);
    
            // Clear any message related to delete mode
            setDeleteModeMessage("");
        } else {
    

            if (handleEditFlag){
                setIsAddingArea(true);
            }
            if (handleEditFlag1){
                const a = handleClickCount + 1;
                setHandleClickCount(a);
            }
            if (handleClickCount >= 1 && handleEditFlag1){
                setHandleEditFlag1(false);
                setHandleClickCount(0);
                const pageCanvas = document.querySelector('.react-pdf__Page__canvas');
                const d = pageCanvas.getBoundingClientRect();
                // console.log("selectedRectangle::",selectedRectangle);

                if (!selectedRectangle) {
                    console.error("No rectangle is currently selected for editing.");
                    return; // Avoid further processing if there is no selected rectangle
                }
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
                            return currentPage;
                        } else {
                            return number;
                        }
                    });
                });
                setEditRectangleActiveIndex(-1);
                setHandleEditFlag(false);
                setHandleEditFlag1(false);
                setIsAddingArea(false);
                setSelectedRectangle(filteredUpdatedRectangles[editRectangleActiveIndex]);
                // setDrawingRectangle(filteredUpdatedRectangles[editRectangleActiveIndex]);
            }
            if (handleEditFlag1 === true && editRectangleActiveIndex !== undefined){
                const r = rectangles[editRectangleActiveIndex];
                if (r !== undefined){
                    setDrawingRectangle(r);
                }
            }
            setHandleEditFlag(false);

        }
    };
    
    
    const handleDeleteRectangle = () => {
        if (handleEditFlag) {
            // alert("Finish editing before deleting a rectangle.");
            setEditModeMessage("Edit mode active. Finish editing or Press 'Edit' again.");
            setTimeout(() => {
                setEditModeMessage("");
            }, 2000);return;
        }
        if (!isDelete) {
            setIsDelete(true);
            setIsAddingArea(false);
            setHandleEditFlag(false);
            setHandleEditFlag1(false);
            setIsResizing(false);
            setEditRectangleActiveIndex(-1);
            setDeleteModeMessage("Delete rectangle mode active.");
            setTimeout(() => {
                setDeleteModeMessage("");
            }, 2000);return;
        } else {
            setIsDelete(false);
            setDeleteModeMessage("");  // Clear the message when deactivating delete mode
        }
    };

    const handleDeletePage = () => {
        if (isDelete) {
            setDeleteModeMessage("Delete Rectangle mode active. Delete or click 'Delete Rectangle' to deactivate.");
            setTimeout(() => {
                setDeleteModeMessage("");
            }, 2000);
            return;
        }
        if (handleEditFlag) {
            setEditModeMessage("Edit mode active. Finish editing or Press 'Edit' again.");
            setTimeout(() => {
                setEditModeMessage("");
            }, 2000);return;
        }
        // Confirm before deleting the page
    if (window.confirm("Are you sure you want to delete this page?")) {
        setFile(null);
    }
    };

    const resetAllStates = () => {
        setDrawingRectangle({x: 0, y: 0, width: 0, height: 0});
        setStartPosition({x: 0, y: 0});
        setEndPosition({x: 0, y: 0});
        setIsAddingArea(false);
        setHandleEditFlag(false);
        setHandleEditFlag1(false);
        setSelectedRectangle(null);
        setIsResizing(false);
        setEditRectangleActiveIndex(-1);
      };
      
    
    const resetDrawingState = () => {
        setDrawingRectangle({ x: 0, y: 0, width: 0, height: 0 }); // Reset the drawing rectangle
        setStartPosition({ x: 0, y: 0 }); // Reset the start position
        setEndPosition({ x: 0, y: 0 }); // Reset the end position
        // Any other cleanup that needs to be done when disabling add area
    };
    

    const generateId = () => {
        if (boundingBoxIds.length < 1) {
            setBoundingBoxIds(prevBoundingBoxIds => [...prevBoundingBoxIds, 1]);
        } else {
            const id = boundingBoxIds[boundingBoxIds.length - 1] + 1;
            setBoundingBoxIds(prevBoundingBoxIds => [...prevBoundingBoxIds, id]);
        }
    }

    

    const handleMouseDown = (e) => {
        if (isDelete || !isAddingArea) {
            // console.log("Delete mode active, operation not allowed.");
            return; // Prevent any action if delete mode is active
        }
        console.log("Enter mouse down")
        if (isAddingArea) {
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
        // console.log("Enter mouse move");
        const pageCanvas = document.querySelector('.react-pdf__Page__canvas');
        if (isDelete){
            // console.log("sdklnsclkaclkalkd");
            const i = rectangles.map((rect, index) => {
                setHandleEditXY({x: Math.abs(e.clientX), y: Math.abs(e.clientY) });
                const xFlag = Math.abs(handleEditXY.x - rect.x) < 4;
                const yFlag = Math.abs(handleEditXY.y - rect.y) < 4;
                const xRightFlag = Math.abs(handleEditXY.x  - rect.x - rect.width) < 4;
                const yRightFlag = Math.abs(Math.abs(handleEditXY.y - rect.y - rect.height)+rectanglesScrollPoints[index]-scrollY) < 4;
                
                let co = 0;
                if (xFlag === true) { co += 1; }
                if (yFlag === true) { co += 1; }
                if (yRightFlag === true) { co += 1; }
                if (xRightFlag === true) { co += 1; }

                if (isResizing) {
                    if (xFlag && yFlag ){
                        // console.log("??????????????");
                        setResizingCursor('not-allowed');
                    }
                    else if (xFlag && yRightFlag ){
                        // console.log("**********************");
                        setResizingCursor('not-allowed');
                    }else if (xRightFlag && yRightFlag){
                        // console.log("+++++++++++++++++++++++");
                        setResizingCursor('not-allowed');
                    }else if (yFlag && xRightFlag){
                        // console.log("-------------------");
                        setResizingCursor('not-allowed');
                    }
                }
            
                if (co === 2) {
                    setIsResizing(true);
                    return index;
                }else{
                    setIsResizing(false);
                }
            });

            const indicesWithCoTwo = i.filter(index => index !== undefined);
            setDeleteIndex(indicesWithCoTwo[0]);

        }

        if(handleEditFlag){
            setHandleEditXY({x: Math.abs(e.clientX), y: Math.abs(e.clientY) });
            const i = rectangles.map((rect, index) => {
                const xFlag = Math.abs(handleEditXY.x - rect.x) < 4;
                const yFlag = Math.abs(handleEditXY.y - rect.y) < 4;
                const xRightFlag = Math.abs(handleEditXY.x  - rect.x - rect.width) < 4;
                const yRightFlag = Math.abs(Math.abs(handleEditXY.y - rect.y - rect.height)+rectanglesScrollPoints[index]-scrollY) < 4;

                let co = 0;
                if (xFlag === true) { co += 1; }
                if (yFlag === true) { co += 1; }
                if (yRightFlag === true) { co += 1; }
                if (xRightFlag === true) { co += 1; }

                if (isResizing) {
                    if (xFlag && yFlag ){
                        // console.log("??????????????");
                        setResizingCursor('nwse-resize');
                    }
                    else if (xFlag && yRightFlag ){
                        // console.log("**********************");
                        setResizingCursor('nesw-resize');
                    }else if (xRightFlag && yRightFlag){
                        // console.log("+++++++++++++++++++++++");
                        setResizingCursor('nwse-resize');
                    }else if (yFlag && xRightFlag){
                        // console.log("-------------------");
                        setResizingCursor('nesw-resize');
                    }
                }
            
                if (co === 2) {
                    setIsResizing(true);
                    return index;
                }else{
                    setIsResizing(false);
                }
            });

            const indicesWithCoTwo = i.filter(index => index !== undefined);
            setEditRectangleActiveIndex(indicesWithCoTwo[0]);
        }
        if (isAddingArea && !handleEditFlag1) {

            setEndPosition({ x: e.clientX, y: e.clientY });
            const updatedRectangle = {
                x: drawingRectangle.x,
                y: drawingRectangle.y,
                width: Math.abs(e.clientX - drawingRectangle.x),
                height: Math.abs(e.clientY - drawingRectangle.y)
            };
            setDrawingRectangle(updatedRectangle);   

            if (pageCanvas){       
                const d = pageCanvas.getBoundingClientRect();
                if (e.clientX > d.x+d.width-1 || e.y > d.y+d.height-1){
                    setStartPosition({x:0,y:0});
                    setStartPosition({ x: 0, y: 0 });
                    setEndPosition({ x: 0, y: 0 });
                    setDrawingRectangle({x: 0,
                        y: 0,
                        width: 0,
                        height: 0});
                    setSelectedRectangle(null);
                    setIsAddingArea(false);

                    if (rectanglesScrollPoints.length > 0) {
                        rectanglesScrollPoints.pop();
                    }

                    if (rectanglesScrollPointsX.length > 0) {
                        rectanglesScrollPointsX.pop();
                    }
                }
            }
        }else if (isAddingArea && handleEditFlag1){
            // console.log("editing move started started");
            setEndPosition({ x: e.clientX, y: e.clientY });
            const updatedRectangle = {
                x: drawingRectangle.x,
                y: drawingRectangle.y,
                width: Math.abs(e.clientX - drawingRectangle.x),
                height: Math.abs(e.clientY - drawingRectangle.y)
            };
            setDrawingRectangle(updatedRectangle); 

            if (pageCanvas){       
                const d = pageCanvas.getBoundingClientRect();
                if (e.clientX > d.x+d.width-1 || e.y > d.y+d.height-1){
                    setStartPosition({x:0,y:0});
                    setStartPosition({ x: 0, y: 0 });
                    setEndPosition({ x: 0, y: 0 });
                    setDrawingRectangle({x: 0,
                        y: 0,
                        width: 0,
                        height: 0});
                    setSelectedRectangle(null);
                    setIsAddingArea(false);
                    setHandleEditFlag(false);
                    setHandleEditFlag1(false);
                    setHandleEditXY({x:0,y:0});
                    setIsResizing(false);
                    setEditRectangleActiveIndex(-1);
                }
            }
        }
    };

    //exper
    const handleMouseUp = (e) => {
        if (isAddingArea && editRectangleActiveIndex === -1) {
            const newRectangle = {
                x: startPosition.x,
                y: startPosition.y,
                width: Math.abs(endPosition.x - startPosition.x),
                height: Math.abs(endPosition.y - startPosition.y),
            };
            if (newRectangle.x !== 0 && newRectangle.y !== 0) {
                const pageCanvas = document.querySelector('.react-pdf__Page__canvas');
                setPageCanvases(prevState => ({
                    ...prevState,
                    [currentPage]: pageCanvas
                }));
                setRectangles(prevRectangles => [...prevRectangles, newRectangle]);
                setPageNumbers(prevPageNumbers => [...prevPageNumbers, currentPage]);
                generateId();
                setSelectedRectangle(newRectangle);
            }
            resetDrawingState(); // Reset drawing state for next operation
            document.body.style.userSelect = 'none'; // Disable text selection
        } else if (isAddingArea && editRectangleActiveIndex !== -1) {
            console.log("Editing move up started");
            const newRectangle = {
                x: startPosition.x,
                y: startPosition.y,
                width: Math.abs(endPosition.x - startPosition.x),
                height: Math.abs(endPosition.y - startPosition.y),
            };
            setRectangles(prevRectangles => [...prevRectangles, newRectangle]);
            const pageCanvas = document.querySelector('.react-pdf__Page__canvas');
            setPageCanvases(prevState => ({
                ...prevState,
                [currentPage]: pageCanvas
            }));
            setPageNumbers(prevPageNumbers => {
                return prevPageNumbers.map((number, index) => {
                    return index === editRectangleActiveIndex ? currentPage : number;
                });
            });
            generateId();
            setSelectedRectangle(newRectangle);
            resetDrawingState(); // Reset drawing state for next operation
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

    

    //expert
    
    
    

    const containerStyle = {
        userSelect: 'none',
        cursor: isAddingArea && !isResizing ? 'crosshair' : (isResizing ? resizingCursor : 'auto'),
        overflow: 'visible', // Allow scrolling within the container
        border: '2px solid red',
        position: 'relative',
    };

    const scale = 0.99; // Adjust based on container size and PDF page dimensions if needed


    

    const handleFileChange = useCallback((event) => {
        const { files } = event.target;
        if (files && files[0]) {
            setIsLoading(true); // Set loading to true when new file is being loaded
            setFile(files[0] || null);
        }
    }, []);

    const handlePreviousPage = () => {
        if (singlePageView) {
            setCurrentPage(Math.max(1, currentPage - 1));
        } else {
            setCurrentPage(Math.max(1, currentPage - pagesPerRow));
        }
        setIsAddingArea(false);
    };
    
    const handleNextPage = () => {
        if (singlePageView) {
            setCurrentPage(Math.min(numPages, currentPage + 1));
        } else {
            setCurrentPage(Math.min(numPages, currentPage + pagesPerRow));
        }
        setIsAddingArea(false);
    };

    const handleBack = () =>{
            setSinglePageView(false);
            const thumbnailPage = Math.ceil(currentPage / pagesPerRow);
            setCurrentPage(thumbnailPage);
            setIsAddingArea(false);
    }

    const handleThumbnailClick = (pageNumber) => {
        setCurrentPage(pageNumber);
        setSinglePageView(true);
    };
    
    const renderPages = () => {

        if (isLoading) {
            return <div>Loading...</div>; // Show loading indicator or handle loading state appropriately
        }
        if (!numPages) return null;
    
        let startIndex, endIndex;

        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
        if (singlePageView) {
            return (           // Detailed view for a single page
                <div style={containerStyle} onDoubleClick={() => setSinglePageView(false)}
                     onMouseDown={handleMouseDown}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                     onClick={handleEditOnClick}>
                    <Document file={file} onLoadSuccess={onDocumentLoadSuccess} options={options}>
                        <Page pageNumber={currentPage} scale={scale} />
                    </Document>
                    {renderRectangles()}
                </div>
            );
        } else {
            const pageCount = Math.ceil(numPages / pagesPerRow);  // Thumbnail view for browsing pages
            startIndex = (currentPage - 1) * pagesPerRow;
            endIndex = Math.min(startIndex + pagesPerRow, numPages);

            return (
                <div className="thumbnails-container" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10px' }}> {/* Adjusted to include gap */}
                    {Array.from({ length: endIndex - startIndex }, (_, index) => {
                        const pageNumber = startIndex + index + 1;
                        return (
                            <div key={`thumbnail_${pageNumber}`} className="thumbnail" onDoubleClick={() => handleThumbnailClick(pageNumber)}> {/* Added inline styles */}
                                <Page pageNumber={pageNumber} width={200} />
                            </div>
            );
        })}
    </div>
            );
        }
    };

    
    
    
    // CSS styles for rectangles
    const rectangleStyle = {
        position: 'absolute',
        border: '2px solid blue', // Adjust border properties as needed
    };

    const [scrollX, setScrollX] = useState(null);
    const [scrollY, setScrollY] = useState(null);
    const [prevScrollY, setPrevScrollY] = useState(scrollY); // State for previous scrollY

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
      }, [scrollX,scrollY,prevScrollY,scrollFixed,rectanglesScrollPoints,handleEditXY,editRectangleActiveIndex,handleClickCount,handleEditFlag1,resizingCursor,isDelete,deleteIndex]);

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
                            >
                            {/* Delete handle/button */}
                            <div className="delete-handle" onClick={() => handleDeleteRectangle(index)}></div>
                        </div>
                    ))}

                    {isAddingArea && drawingRectangle.x!==0 && drawingRectangle.y!==0  && editRectangleActiveIndex===-1 &&(
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

                    
                    {isAddingArea && drawingRectangle.x!==0 && drawingRectangle.y!==0  &&  editRectangleActiveIndex > -1 && (
                        <div
                            className="rectangle"
                            style={{
                                position: 'absolute',
                                border: '2px solid blue', // Adjust border properties as needed
                                left: `${Math.abs(drawingRectangle.x- canvasPage.x)}px`,
                                top:  (rectanglesScrollPoints[editRectangleActiveIndex] === 0 ? `${drawingRectangle.y - canvasPage.y - scrollY}px` : `${drawingRectangle.y - canvasPage.y - scrollY + rectanglesScrollPoints[editRectangleActiveIndex]}px`),
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
 
    const clearAddAreaMessage = () => {
        setAddAreaMessage(""); // Clear the message state
    };

    const clearEditModeMessage = () => {
        setEditModeMessage(""); // Clear the message state
    };
    
    const clearDeleteModeMessage = () => {
        setDeleteModeMessage(""); // Clear the message state
    };

    
    
    return (
        <div id='maincontainer'className='mt-8 mx-8' style={{border: '2x solid black'}}>
            <div className="flex justify-around items-center">
            <MdKeyboardBackspace size={36} onClick={handleBack}/>
                <div className='flex justify-start gap-8'>
                    <BackgroundButton Text={"Add Page"} onClick={handleAddPage} />
                    <BackgroundButton Text={"+ Add Area"} onClick={handleAddArea} />
                    <Notification message={addAreaMessage} clearMessage={clearAddAreaMessage}/>
                    <BackgroundButton Text={"Generate PDF"} onClick={handleGenerateImage} />
                    <BackgroundButton Text={"Edit"} onClick={handleEdit} />
                    <Notification message={editModeMessage} clearMessage={clearEditModeMessage}/>
                    <BackgroundButton Text={"Delete Rectangle"} onClick={handleDeleteRectangle} />
                    <Notification message={deleteModeMessage} clearMessage={clearDeleteModeMessage}/>
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

export default () => (
    <CustomErrorBoundary>
        <PageView/>
    </CustomErrorBoundary>
);