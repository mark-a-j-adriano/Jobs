<?php 
    date_default_timezone_set('Asia/Singapore');
    header('Access-Control-Allow-Origin: *');  
    //session_start();
    
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
    $formType = $meta['formType'];
    $fileDesc = $meta['fileDesc'];
    $traceNum = $meta['traceNum'];
    $date=date_create();

    if($debugOn) {
        $logstr = "=================================================================\r\n";
        $logstr = $logstr.date_timestamp_get($date)."\r\n";
        $logstr = $logstr."=================================================================\r\n";
        $logstr = $logstr."working directory : ".getcwd()."\r\n";
        $logstr = $logstr."formType : ". $formType."\r\n";
        $logstr = $logstr."fileDesc : ".$fileDesc."\r\n";
        $logstr = $logstr."traceNum : ".$traceNum."\r\n";
        $logstr = $logstr."request : ".json_encode($request)."\r\n";  
        $logstr = $logstr."Files : ".json_encode($_FILES)."\r\n";  
     }
   

    $json_response = "";
    $newDirectory =  $formType.'/'.$fileDesc.'/'.$traceNum;
    $fileAtt = $_FILES['file']['name'];
    $filename = $newDirectory.'/'.$fileAtt;     
 
    if (!file_exists($newDirectory)) {  
        if($debugOn) {
            $logstr = $logstr."creating new directory : ".$newDirectory."\r\n";
            $logstr = $logstr."uploaded file[0] : ".$_FILES['file']['tmp_name']."\r\n"; 
        }
        if (!mkdir($newDirectory, 0777, true)) {
            $json_response = '[ERROR] - Failed to create folders...';   
            die('Failed to create folders...');         
        } else {
            if(move_uploaded_file( $_FILES['file']['tmp_name'] , $filename)){                
                if($debugOn) {                
                    $logstr = $logstr."uploaded file[1] : ".$filename."\r\n";
                }
                $json_response = $filename;  
            }         
        }
    }else{     
        if($debugOn) {
            $logstr = $logstr."directory already exist : ".$newDirectory."\r\n";  
            $logstr = $logstr."uploaded file[3] : ".$_FILES['file']['tmp_name']."\r\n";     
        }      

        if (file_exists($filename)) {
            $pieces = explode(".", $fileAtt);  
            $digits = 2;
            $rndm = rand(pow(10, $digits-1), pow(10, $digits)-1);
            $filename = $newDirectory.'/'.$pieces[0].$rndm.'.'.$pieces[1];
        }
       
        if(move_uploaded_file( $_FILES['file']['tmp_name'] , $filename)){                
            if($debugOn) {                
                $logstr = $logstr."uploaded file[4] : ".$filename."\r\n";
            }
            $json_response = $filename;  
        }   
    }
    
    if( $debugOn ) {
        error_log($logstr, 3, $logfile); 
    }
 
    if (empty($json_response)) { 
        $json_response = $logstr;
    }

    echo $json_response;
    
?>