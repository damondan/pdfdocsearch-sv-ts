<div class="container">
  <nav class="routing">
    <a href="/">home</a>
    <a href="/diagram">diagram</a>
  </nav>

</div>

<style lang="scss">
  
  .container{
    background-color: #2196f3;
    background: linear-gradient(180deg, #2196f3, #f5f5f5); 
    min-height: 100vh;  // Changed from height to min-height
    width: 100vw;
    border-radius: 4px;
    
	.routing {
    padding: 10px;
        a {
          font-family: cursive;
          font-size: 18px;
          font-weight: 700;
          text-decoration: none;  /* Removes the underline */
          color: black;  /* Sets the text color */
          padding: 5px;  /* Adds some padding around the link */
          transition: all 0.3s ease;  /* Smooth transition for hover effect */
      
          &:hover {
            color: white;  
            background-color: #007BFF;  
            border-radius: 4px; 
          }
        }
    }
  }

</style>