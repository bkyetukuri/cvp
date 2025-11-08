
namespace md;
    
    ///  PDF Related entites
     @cds.persistence.name: 'MD_FORM'
    entity FORM {
        key formId      : String(60) not null;          // e.g. GENERIC_SO
        isAdsForm   : Boolean default false;
        adsFormName : String(80);
        pdfFile     : String(5000);
    }
 
    // ---------- Assignment rules ----------
    @cds.persistence.unique: [
    // prevent duplicate rule rows for the same selector+form
    ['l1Customer','soldTo','mvgr2','requestType','productId','formId']
    ]
 
    @cds.persistence.index: [
    ['l1Customer','soldTo','mvgr2','requestType','productId']  //
    ]
   
    @cds.persistence.name: 'MD_FORM_ASSIGN'
    entity FORM_ASSIGN {
        key id            : UUID;             // stable PK (UUID)
        l1Customer    : String(10);
        soldTo        : String(10);
        mvgr2         : String(4);       // (use 4 if you want to match your legacy width)
        requestType   : String(40);       // (use 2 if you want to match your legacy width)
        productId     : String(40);       // optional; use '*' or leave empty in data
        printSequence : Integer default 0;
 
        // explicit FK column + association for joins
        formId        : String(60) not null;
        form          : Association to FORM on form.formId = formId;
    }