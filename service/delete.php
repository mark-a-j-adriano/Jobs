<?php 
    date_default_timezone_set('Asia/Singapore');
    header('Access-Control-Allow-Origin: *');  
    // Change directory
    chdir("tmp");

    $debugOn = false;  
    $logfile  = "upload_log.log";    
    $meta = $_POST;

    if($request = json_decode(file_get_contents("php://input"))){
        //browser request
    } 
    else{
        //mobile request
        $postdata     = $_POST;   
        $jsonString   = json_encode($postdata);  
        $request      = json_decode($jsonString);
    }          
   
    $date=date_create();

    if($debugOn) {
        $logstr = "=================================================================\r\n";
        $logstr = $logstr."REMOVE FILE FUNCTION - ".date_timestamp_get($date)."\r\n";
        $logstr = $logstr."=================================================================\r\n";
        $logstr = $logstr."working directory : ".getcwd()."\r\n";      
        $logstr = $logstr."request : ".json_encode($request)."\r\n"; 
        $logstr = $logstr."fileURL : |".$request->fileLoc."|\r\n"; 
     }

    $fileURL = substr($request->fileLoc,12); 
    if (file_exists($fileURL)) {  
        if (unlink($fileURL)){
            $logstr = $logstr."Deleted file: |".$fileURL."|\r\n";
            $json_response = "[SUCCESS] - Deleted file: ".$fileURL;                
        }else{
            $logstr = $logstr."Error deleting file: |".$fileURL."|\r\n";            
            $json_response = "[ERROR] - Error deleting file: ".$fileURL;           
        }
    }else{
        $logstr = $logstr."Cannot find file : |".$fileURL."|\r\n";
        $json_response = "[ERROR] - Cannot find file : ".$fileURL;      
    }
   
    if( $debugOn ) {
        error_log($logstr, 3, $logfile); 
    }

    echo $json_response;
?>
    
    
    
    
    
   