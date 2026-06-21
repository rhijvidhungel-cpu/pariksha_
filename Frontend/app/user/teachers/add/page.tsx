"use client";

import { useState } from "react";

export default function AddTeacherPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // API call will go here later

    console.log({
      fullName,
      username,
      password,
      department,
    });

    alert("Teacher Added Successfully");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-8">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 mt-20 w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-white">

                <span 
                     className="bg-linear-to-r text-transparent from-blue-500 to-purple-500 bg-clip-text">Add Teacher</span>
                
                </h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="mb-6">
                                      <label htmlFor="FullName" className="block text-gray-700 text-sm font-bold mb-2">
                                          
                                        
                                          Full Name</label>
                                      <div> 
                                           <input id="FullName" type="text" autoComplete='off' className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Enter the full name" />
                                      </div>
                                  </div>

          <div className="mb-6">
                                      <label htmlFor="Username" className="block text-gray-700 text-sm font-bold mb-2">
                                          
                                        
                                          Username</label>
                                      <div> 
                                           <input id="Username" type="text" autoComplete='off' className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Enter the username" />
                                      </div>
                                  </div>

         <div className="mb-6">
                                      <label htmlFor="Password" className="block text-gray-700 text-sm font-bold mb-2">
                                          
                                        
                                          Password</label>
                                      <div> 
                                           <input id="Password" type="password" autoComplete='off' className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Enter the password" />
                                      </div>
                                  </div>
          <div className="mb-6">
                                      <label htmlFor="Department" className="block text-gray-700 text-sm font-bold mb-2">
                                          
                                        
                                          Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border rounded p-3"
              required
            >
              <option value="">Select Department</option>
              <option value="CS">Computer Science</option>
              <option value="CE">Computer Engineering</option>
              <option value="MG">Management</option>
            </select>
          </div>

         <div  className="flex item-center justify-center"><button type="submit"  className="bg-linear-to-r from-blue-500 to-purple-500 hover:from blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:outline-shadow w-fullS"  >Add teacher</button>   </div>
        </form>
      </div>
    </div>
  );
}