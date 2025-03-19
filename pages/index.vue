<script setup lang="ts">
   useSeoMeta({
     title: "Home",
   });
   
   definePageMeta({
     layout: "public",
   });
</script>

<template>
   <div>
      <div class="bg-wrapper relative">
         <div class="absolute inset-0 bg-black opacity-50"></div>
         <UContainer class="relative z-10 text-white">
            <div class="flex flex-col sm:flex-row px-4 pt-8">
               <!-- Left side for <p> element -->
               <div class="flex-1 text-center sm:text-left">
                  <h1 class="custom-title sm:-ml-30 -mt-10">
                     Seeing the Future of Brain Health through a Data-Driven Eye Imaging Platform
                  </h1>
                  <p class="text-3xl font-medium sm:px-16 lg:text-4xl xl:text-10xl sm:-ml-40 mt-10 sm:mt-100">
                     The Envision Portal is a cutting-edge platform to revolutionize the process of uploading, 
                     preparing, and sharing eye imaging data.
                  </p>
               </div>
               <!-- Right side for the buttons -->
               <div class="flex-1 flex flex-col sm:flex-row items-center justify-center sm:justify-end space-y-4 sm:space-y-0 sm:space-x-4 sm:-ml-40 mt-10 sm:mt-140">
                  <UButton to="/dashboard" icon="line-md:upload-loop" size="xl" style="background-color: #ccffff; border: 2px solid #ccffff; color: #333333;"> 
                     Get started 
                  </UButton>
                  <UButton
                     to="https://github.com/eyeact/envision-portal"
                     icon="i-simple-icons-github"
                     size="xl"
                     target="_blank"
                     variant="outline"
                     color="neutral"
                     label="View on GitHub"
                     >
                     View on GitHub
                  </UButton>
               </div>
            </div>
         </UContainer>
      </div>
      <UContainer class="py-24">
         <div
            class="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
            <!-- Left Side Content (Text and Paragraph) -->
            <div class="text-center lg:text-left">
               <h4 class="text-3xl font-extrabold text-gray-500 sm:text-4xl">
                  What we do
               </h4>
            </div>
            <!-- Right Side Content (Image and Button) -->
            <div class="flex flex-col justify-center">
               <h1 class="mt-4 text-xl text-gray-700 text-left">
                  We leverage AI and machine learning to provide cutting-edge insights into eye and brain health through 
                  a platform that optimizes data analysis.
               </h1>
               <!-- TODO: Add redirect link -->
               <div class="mt-6 text-left">
                  <UButton
                     to=""
                     size="xl"
                     class="w-35 custom-button"
                     style="background-color: #ccffff; border: 2px solid #ccffff; color: #333333;"
                     >
                     Learn More 
                  </UButton>
               </div>
            </div>
         </div>
      </UContainer>
      <UContainer class="py-24">
         <div
            class="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center"
            >
            <!-- Left Side Content (Text and Paragraph) -->
            <div class="text-center lg:text-left">
               <h1 class="text-4xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text sm:text-5xl">
                  Accurate
               </h1>
               <p class="mt-4 text-lg text-gray-600 leading-relaxed">
                  Our AI-powered data platform serves as a trusted 
                  and comprehensive source of truth, enabling organizations 
                  to make informed, data-driven decisions at scale.
               </p>
            </div>
            <!-- Right Side Content (Image) -->
            <div class="flex flex-col justify-center lg:col-span-2">
               <div class="mt-6 text-left">
                  <img
                     src="public/images/brain.jpg"
                     alt="Brain and Eye Health"
                     class="w-full max-w-2xl h-auto rounded-lg shadow-xl transform transition-all duration-300 hover:scale-105"
                     />
               </div>
            </div>
         </div>
      </UContainer>
      <UContainer class="bg-gray-100 py-24 dark:bg-gray-400">
         <div
            class="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
            <!-- Left Side Content (Image) -->
            <div class="flex justify-center lg:justify-end">
               <img
                  src="public/images/ai-eye.jpg"
                  alt="AI Eye"
                  class="w-full max-w-lg rounded-lg shadow-xl transform transition-all duration-300 hover:scale-105"
                  />
            </div>
            <!-- Right Side Content (Text) -->
            <div class="text-center lg:text-left">
               <h1 class="text-4xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text sm:text-5xl">
                  Scalable
               </h1>
               <p class="mt-4 text-lg text-gray-600 leading-relaxed">
                  We process data at scale, with unparalleled speed and 
                  scalability across all research, delivering detailed 
                  and complete insights into the real world.
               </p>
            </div>
         </div>
      </UContainer>
      <UContainer class="py-24">
         <div
            class="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center"
            >
            <!-- Left Side Content (Text) -->
            <div class="text-center lg:text-left">
               <h1 class="text-4xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text sm:text-5xl">
                  Up-to-date 
               </h1>
               <p class="mt-4 text-lg text-gray-600 leading-relaxed">
                  Our global partners provide the latest medical imaging and 
                  specialized data, which are then rapidly mined using our AI-based 
                  systems to create and maintain a current representation of reality.
               </p>
            </div>
            <!-- Right Side Content (Image) -->
            <div class="flex flex-col justify-center lg:col-span-2">
               <div class="mt-6 text-left">
                  <img
                     src="public/images/ai-brain.jpg"
                     alt="AI Brain"
                     class="w-full max-w-2xl rounded-lg shadow-xl transform transition-all duration-300 hover:scale-105"
                     />
               </div>
            </div>
         </div>
      </UContainer>
      <UContainer class="bg-gray-100 py-12 dark:bg-gray-500">
         <div class="max-w-7xl mx-auto px-6 lg:px-8">
            <div class="text-center">
               <h1 class="text-2xl font-bold text-gray-900">Snapshot of the One-Stop Solution</h1>
               <p class="text-lg text-gray-600 mt-2">Some key numbers from the project</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
               <div class="bg-white p-6 rounded-lg shadow-md text-center dark:bg-gray-400">
                  <h2 class="text-4xl font-bold text-blue-400">5,763</h2>
                  <p class="text-gray-700 mt-2">Total participants enrolled</p>
               </div>
               <div class="bg-white p-6 rounded-lg shadow-md text-center dark:bg-gray-400">
                  <h2 class="text-4xl font-bold text-blue-400">24,000+</h2>
                  <p class="text-gray-700 mt-2">Biennial study visits conducted</p>
               </div>
               <div class="bg-white p-6 rounded-lg shadow-md text-center dark:bg-gray-400">
                  <h2 class="text-4xl font-bold text-blue-400">2000+</h2>
                  <p class="text-gray-700 mt-2">Cases recorded</p>
               </div>
               <div class="bg-white p-6 rounded-lg shadow-md text-center dark:bg-gray-400">
                  <h2 class="text-4xl font-bold text-blue-400">80,000+</h2>
                  <p class="text-gray-700 mt-2">Clinic visits extracted</p>
               </div>
               <div class="bg-white p-6 rounded-lg shadow-md text-center dark:bg-gray-400">
                  <h2 class="text-4xl font-bold text-blue-400">18,000+</h2>
                  <p class="text-gray-700 mt-2">Clinical retinal images analyzed</p>
               </div>
               <div class="bg-white p-6 rounded-lg shadow-md text-center dark:bg-gray-400">
                  <h2 class="text-4xl font-bold text-blue-400">3,000</h2>
                  <p class="text-gray-700 mt-2">Expanded active participants</p>
               </div>
            </div>
         </div>
      </UContainer>
      <UContainer class="py-24">
         <div class="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 class="text-4xl font-bold text-gray-900 dark:text-gray-200 text-center">
               Unlocking Eye & Brain Health Insights
            </h2>
            <p class="mt-4 text-lg text-gray-600 dark:text-gray-300 text-center">
               Explore how AI and data-driven research are transforming ophthalmology and neuroscience.
            </p>
            <!-- Grid Layout for 6 Cards -->
            <div class="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               <!-- Card 1 -->
               <div class="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl transition-transform duration-300 hover:scale-105">
                  <img src="public/images/brain-health.jpg" alt="Retinal & Brain Health" class="w-full h-40 object-cover rounded-lg mb-4" />
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                     Linking Retinal Changes to Brain Health
                  </h3>
                  <p class="mt-2 text-gray-600 dark:text-gray-300">
                     Analyzes retinal structure and vascular features to detect neurological risks.
                  </p>
                  <button class="mt-4 bg-[#ccffff] text-gray-900 px-4 py-2 rounded-lg hover:bg-[#b3e6e6]">
                  Learn More
                  </button>
               </div>
               <!-- Card 2 -->
               <div class="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl transition-transform duration-300 hover:scale-105">
                  <img src="public/images/data.jpg" alt="Longitudinal Data" class="w-full h-40 object-cover rounded-lg mb-4" />
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                     Leveraging Longitudinal Data
                  </h3>
                  <p class="mt-2 text-gray-600 dark:text-gray-300">
                     Tracks thousands of participants over decades for deep, diverse insights.
                  </p>
                  <button class="mt-4 bg-[#ccffff] text-gray-900 px-4 py-2 rounded-lg hover:bg-[#b3e6e6]">
                  Learn More
                  </button>
               </div>
               <!-- Card 3 -->
               <div class="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-2xl transition-transform duration-300 hover:scale-105">
                  <img src="public/images/data-modeling.jpg" alt="Predictive Modeling" class="w-full h-40 object-cover rounded-lg mb-4" />
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                     Advancing Predictive Modeling
                  </h3>
                  <p class="mt-2 text-gray-600 dark:text-gray-300">
                     AI-driven analysis helps predict disease risks early on.
                  </p>
                  <button class="mt-4 bg-[#ccffff] text-gray-900 px-4 py-2 rounded-lg hover:bg-[#b3e6e6]">
                  Learn More
                  </button>
               </div>
            </div>
         </div>
      </UContainer>
   </div>
   <section id="footer">
    <img src="public/images/footer.jpg" alt="Predictive Modeling" class="w-full h-150 object-cover" />
    
    <div class="main-footer">
      <!-- Logo & Mission -->
      <div class="logoinfo">
        <h2>Envision Portal</h2>
        <p>Seeing the Future of Brain Health Through the Eyes</p>

        <div class="contact-details">
          <h1>Contact Us</h1>
          <ul>
            <li>
              <div class="fa fa-phone"></div><a href="tel:+1234567890">+1 234 567 890</a>
            </li>
            <li>
              <div class="fa fa-envelope"></div><a href="mailto:contact@eyeact.com">contact@eyeact.com</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Navigation Links -->
      <div class="com">
        <h1>Quick Links</h1>
        <ul>
          <li><a href="#">Home</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Research</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>

      <!-- Social Media -->
      <div class="info">
        <h1>Follow Us</h1>
        <div class="sociallogos">
          <div class="logobox">
            <a href="#" class="fa fa-instagram"></a>
            <a href="#" class="fa fa-linkedin"></a>
            <a href="#" class="fa fa-twitter"></a>
            <a href="#" class="fa fa-youtube-play"></a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
