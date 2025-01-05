import './App.css';
import React, { useState } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

function App() {
  const [reportData, setreportData] = useState(null);
  const [inputValue, setInputValue] = useState("");

  const loadLogo = (path) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = path;
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = (err) => {
        console.error("Image failed to load:", path, err);
        reject(err);
      };
      
    });
  };

  const downloadPDF = async() => {
    console.log(reportData);
    if (!reportData) {
      alert("Data not loaded. Please try again later.");
      return;
    }
  
    const doc = new jsPDF();
  
    const {
      iDAndContactInfo: {
        personalInfo,
        identityInfo,
        addressInfo,
        phoneInfo,
        emailAddressInfo,
      },
      retailAccountsSummary,
      retailAccountDetails,
      scoreDetails,
      enquiries,
      enquirySummary,
      recentActivities,
    } = reportData.data.cCRResponse.cIRReportDataLst[0].cIRReportData;
    
    // Title and Header
       
    const RealScoreLogo = await loadLogo("/generateCreditReport/image/RealScoreLogo.png");
    const EquifaxLogo = await loadLogo("/generateCreditReport/image/EquifaxLogo.png")

    doc.setFontSize(18);
    doc.addImage(RealScoreLogo,"PNG",7,3,26,13);
    doc.text("Equifax Credit Report", 105, 15, { align: "center" });
    doc.addImage(EquifaxLogo,"PNG",170,10,31,6);
    doc.setFontSize(10);
    doc.setDrawColor(0);
    doc.line(10, 20, 200, 20);
    doc.text(`${Date().toLocaleUpperCase()}`, 95, 25);
    doc.text(`Report Order No.: ${reportData.reference_id}`, 10, 25);
    doc.line(10, 32, 200, 32);
  
    let yPosition = 40; // Start position for the content
  
    // Personal Information
    doc.setFontSize(14);
    doc.text(`Consumer Name: ${personalInfo.name.fullName}`, 15, yPosition);
    yPosition += 5;
    doc.autoTable({
      startY: yPosition,
      head: [["Personal Info", "Identification", "Contact Details"]],
      body: [
        [
          `Previous Name: ${personalInfo.previousName || "--"}\nAlias Name: ${personalInfo.aliasName || "--"}\nDOB: ${personalInfo.dateOfBirth}\nAge: ${personalInfo.age.age} Years\nGender: ${personalInfo.gender}\nTotal Income: ${personalInfo.totalIncome}\nOccupation: ${personalInfo.occupation}`,
          `PAN: ${identityInfo.pANId[0]?.idNumber || "--"}\nVoter ID: ${identityInfo.voterId || "--"}\nPassport: ${identityInfo.passport || "--"}\nUID: ${identityInfo.uID || "--"}\nDriver's License: ${identityInfo.driversLicense || "--"}\nRation Card: ${identityInfo.rationCard || "--"}\nPhoto Credit Card: ${identityInfo.photoCreditCard || "--"}\nOther ID: ${identityInfo.otherId[0]?.idNumber || "--"}`,
          `Home: ${phoneInfo[0]?.number || "--"}\nOffice: ${phoneInfo[1]?.number || "--"}\nMobile: ${phoneInfo[2]?.number || "--"}\nAlt. Home/Other No.: ${phoneInfo[3]?.number || "--"}\nAlt. Office: ${phoneInfo[4]?.number || "--"}\nAlt. Mobile: ${phoneInfo[5]?.number || "--"}\nEmail: ${emailAddressInfo[0]?.emailAddress || "--"}`,
        ],
      ],
      styles: { fontSize: 8, cellPadding: 4 },
    });
    yPosition = doc.autoTable.previous.finalY + 15;
  
    // Address Information
    doc.setFontSize(14);
    doc.text("Consumer Address:", 15, yPosition);
    yPosition += 5;
    doc.autoTable({
      startY: yPosition,
      head: [["Type", "Address", "State", "Postal Code", "Last Reported Date"]],
      body: addressInfo.map((address) => [
        address.type,
        address.address,
        address.state,
        address.postal,
        address.reportedDate,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
    });
    yPosition = doc.autoTable.previous.finalY + 10;
  
    // Score Details
    doc.setFontSize(14);
    doc.text("Equifax Score(s):", 15, yPosition);
    yPosition += 5.7;
    doc.autoTable({
      startY: yPosition,
      head: [["Score Name", "Score", "Scoring Elements"]],
      body: scoreDetails.map((score) => [
        score.name,
        score.value,
        score.scoringElements.map((element) => element.description).join(", "),
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
    });
    yPosition = doc.autoTable.previous.finalY + 15;
  
    // Recent Activities
    doc.setFontSize(14);
    doc.text("Recent Activity:", 15, yPosition);
    yPosition += 5;
    doc.autoTable({
      startY: yPosition,
      head: [
        [
          {
            content: "Recent Activity (last 90 days)",
            colSpan: 4,
            styles: { halign: "center", fontSize: 8, fontStyle: "bold" },
          },
        ],
      ],
      body: [
        [
          `Total Inquiries: ${recentActivities.totalInquiries}`,
          `Accounts Opened: ${recentActivities.accountsOpened}`,
          `Accounts Updated: ${recentActivities.accountsUpdated}`,
          `Accounts Delinquent: ${recentActivities.accountsDeliquent}`,
        ],
      ],
      styles: { fontSize: 8, cellPadding: 4 },
    });
    // Retail Account Summary
    
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(14);
    doc.text("Credit Report Summary:", 15, yPosition);
    doc.autoTable({
      startY: yPosition+5,
      head: [
        [
          {
            content: "Credit Report Summary",
            colSpan: 3,
            styles: { halign: "center", fontSize: 8, fontStyle: "bold" },
          },
        ],
      ],
      body: [
        [
          `Number of Accounts: ${retailAccountsSummary.noOfAccounts}\nNumber of Open Accounts: ${retailAccountsSummary.noOfActiveAccounts}\nNumber of Past Due Accounts: ${retailAccountsSummary.noOfPastDueAccounts}\nNumber of Zero Balance Accounts: ${retailAccountsSummary.noOfZeroBalanceAccounts}\nMost Severe Status < 24 Months: ${retailAccountsSummary.mostSevereStatusWithIn24Months}`,
          `Total Balance Amount: ${retailAccountsSummary.totalBalanceAmount}\nTotal Past Due Amount: ${retailAccountsSummary.totalPastDue}\nTotal High Credit: ${retailAccountsSummary.totalHighCredit}\nTotal Sanction Amount: ${retailAccountsSummary.totalSanctionAmount}\nAverage Open Balance: ${retailAccountsSummary.averageOpenBalance}`,
          `Recent Account: ${retailAccountsSummary.recentAccount}\nOldest Account: ${retailAccountsSummary.oldestAccount}\nTotal Credit Limit: ${retailAccountsSummary.totalCreditLimit}\nSingle Highest Credit: ${retailAccountsSummary.singleHighestCredit}\nSingle Highest Sanction Amount: ${retailAccountsSummary.singleHighestSanctionAmount}\nSingle Highest Balance: ${retailAccountsSummary.singleHighestBalance}`,
        ],
      ],
      styles: { fontSize: 7, cellPadding: 4 },
    });

    //Retail Account Details
    doc.text("Retail Account Details:", 15, doc.autoTable.previous.finalY+10);
    retailAccountDetails.forEach((account, index) => {
      yPosition = doc.autoTable.previous.finalY + 10; 
      // Retail Account Details Table
      doc.setFontSize(14);
      if(index!==0){doc.line(10,yPosition,200,yPosition)};   
      yPosition+=5;
      doc.autoTable({
          startY: yPosition,
          head: [
              [
                  {
                      content: `Account ${index + 1}`,
                      colSpan: 4,
                      styles: { halign: "center", fontSize: 8, fontStyle: "bold" },
                  },
              ],
          ],
          body: [
              [
                  `Acct: ${account.accountNumber}\nInstitution: ${account.institution}\nType: ${account.accountType}\nOwnership: ${account.ownershipType}\n\n\nRepayment Tenure: ${account.repaymentTenure}\nDispute Code: ${account.disputeCode}\n\n\nAccount Status: ${account.accountStatus}\nAsset Classification: ${account.assetClassification}`,
                  `Balance: ${account.balance}\nPast Due Amount: ${account.pastDueAmount}\nLast Payment: ${account.lastPayment}\nWrite-off Amount: ${account.writeOffAmount}\n\n\nEMI: ${account.installmentAmount}\nTerm Frequency: ${account.termFrequency}`,
                  `Open: ${account.open}\nInterest Rate: ${account.interestRate}\nLast Payment Date: ${account.lastPaymentDate}\nSanction Amount: ${account.sanctionAmount}\n\n\nCredit Limit: ${account.creditLimit}`,
                  `Date Reported: ${account.dateReported}\nDate Opened: ${account.dateOpened}\nDate Closed: ${account.dateClosed}\nReason: ${account.reason}`
                ],
          ],
          styles: { fontSize: 7, cellPadding: 4 },
      });
      yPosition = doc.autoTable.previous.finalY+2; 
            const historyKeys = account.history48Months.map((history) => history.key);
            const paymentStatuses = account.history48Months.map((history) => history.paymentStatus);
           
            const chunkArray = (array, chunkSize) => {
                const result = [];
                for (let i = 0; i < array.length; i += chunkSize) {
                    result.push(array.slice(i, i + chunkSize));
                }
                return result;
            };

            const chunkedHistoryKeys = chunkArray(historyKeys, 15);
            const chunkedPaymentStatuses = chunkArray(paymentStatuses, 15);
            
            chunkedHistoryKeys.forEach((chunk, chunkIndex) => {
                const chunkData = [
                    ["Month", ...chunk], 
                    ["Payment Status", ...chunkedPaymentStatuses[chunkIndex]], 
                   
                ];

                const chunkLength = chunk.length;
                const columnCount = chunkLength + 1; 

                const columnWidth = 180 / columnCount; 
                const columnWidths = Array(columnCount).fill(columnWidth); 
                doc.autoTable({
                    startY: yPosition + (chunkIndex * 20), 
                    body: chunkData, 
                    columnWidth: columnWidths,
                    styles: { fontSize: 7, cellPadding: 2 ,lineWidth: 0.1,lineColor: [0, 0, 0],},
                  });   
      }); 
  });
    
    yPosition = doc.autoTable.previous.finalY + 15;
  
    // Enquiry Summary
    doc.setFontSize(14);
    doc.text("Enquiry Summary:", 15, yPosition);
    yPosition += 5;
    doc.autoTable({
      startY: yPosition,
      head: [
        ["Purpose", "Total", "Past 30 Days", "Past 12 months", "Past 24 Months", "Recent"],
      ],
      body: [
        [
          `${enquirySummary.purpose}`,
          `${enquirySummary.total}`,
          `${enquirySummary.past30Days}`,
          `${enquirySummary.past12Months}`,
          `${enquirySummary.past24Months}`,
          `${enquirySummary.recent}`,
        ],
      ],
      styles: { fontSize: 8, cellPadding: 4 },
    });
    yPosition = doc.autoTable.previous.finalY + 15;
  
    // Enquiries
    doc.setFontSize(14);
    if(yPosition>200)
    {
      doc.addPage();
      yPosition=20;
    }
    doc.text("Enquiries:", 15, yPosition);
    yPosition += 5;
    doc.autoTable({
      startY: yPosition,
      head: [["Institution", "Date", "Time", "Purpose", "Amount"]],
      body: enquiries.map((enquiry) => [
        enquiry.institution,
        enquiry.date,
        enquiry.time,
        enquiry.requestPurpose,
        enquiry.amount,
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
    });
  
    // Save PDF
    doc.save("Equifax_Credit_Report.pdf");
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    try {
      const parsedData = JSON.parse(e.target.value);
      setreportData(parsedData);
    } catch (err) {
      setreportData(null);
    }
  };

return (
  <div className="app-container">
      {/* Logo */}
      <img
          src="/generateCreditReport/image/RealScoreLogo.png"
          alt="Real Score Logo"
          className="logo"
      />

      {/* Title */}
      <h1 className="title">Enter JSON Data Below</h1>

      {/* Text Area */}
      <textarea
          className="text-field"
          placeholder="Paste JSON data here..."
          value={inputValue}
          onChange={handleInputChange}
          rows={10}
      />

      {/* Button */}
      <button
          className="action-button"
          onClick={downloadPDF}
          disabled={!reportData}
      >
          Generate PDF
      </button>
  </div>
);
}
export default App;
