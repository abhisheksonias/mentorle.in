"use client";

import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Target,
  Clock,
  Building,
  FileText,
  Lightbulb,
  Globe,
  Briefcase,
  Languages,
  Code,
  Download
} from "lucide-react";
import Image from "next/image";

export default function ProfileDisplay({ profile }) {
  const formatArrayField = (field) => {
    if (!field || !Array.isArray(field) || field.length === 0) return "Not specified";
    return field.join(", ");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      {profile?.profile_url && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300">
              <Image
                src={profile.profile_url}
                alt="Profile"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile?.name || "User"}</h2>
              <p className="text-gray-600">{profile?.current_status || "Current Status"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Completion */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Completion</h2>

        {(() => {
          const totalFields = 12;
          const completed = [
            profile?.name,
            profile?.email,
            profile?.bio,
            profile?.goals,
            profile?.current_status,
            profile?.education_level,
            profile?.education?.field && profile?.education?.degree && profile?.education?.school,
            profile?.location,
            profile?.interests,
            profile?.linkedin_url,
            profile?.github_url,
            profile?.instagram_url
          ].filter(
            field =>
              field &&
              (Array.isArray(field)
                ? field.length > 0
                : typeof field === 'string'
                  ? field.trim() !== ''
                  : field === true)
          ).length;

          const percentage = Math.round((completed / totalFields) * 100);

          return (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-medium text-gray-900">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })()}
      </div>
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="flex items-center gap-2 text-gray-900">
                <User className="h-4 w-4 text-gray-400" />
                <span>{profile?.name || "Not specified"}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{profile?.email || "Not specified"}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{profile?.phone || "Not specified"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Building className="h-4 w-4 text-gray-400" />
                <span>{profile?.current_status || "Not specified"}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
              <div className="flex items-center gap-2 text-gray-900">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <span>{profile?.education_level || "Not specified"}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="flex items-center gap-2 text-gray-900">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{profile?.location || "Not specified"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Education */}
      {profile?.education && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Education Details
          </h2>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                <div className="text-gray-900">
                  {profile.education.field || "Not specified"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                <div className="text-gray-900">
                  {profile.education.degree || "Not specified"}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">School/University</label>
                <div className="text-gray-900">
                  {profile.education.school || "Not specified"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
                <div className="text-gray-900">
                  {profile.education.start_year || "Not specified"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Year</label>
                <div className="text-gray-900">
                  {profile.education.end_year || "Not specified"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bio */}
      {profile?.bio && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Bio
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        </div>
      )}

      {/* Goals */}
      {profile?.goals && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Goals
          </h2>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {profile.goals}
            </p>
          </div>
        </div>
      )}

      {/* Interests */}
      {profile?.interests && Array.isArray(profile.interests) && profile.interests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Interests
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest, index) => (
              <span
                key={index}
                className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preferred Industries */}
      {profile?.preferred_industries && Array.isArray(profile.preferred_industries) && profile.preferred_industries.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Preferred Industries
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.preferred_industries.map((industry, index) => (
              <span
                key={index}
                className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {profile?.languages && Array.isArray(profile.languages) && profile.languages.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Languages className="h-5 w-5 text-green-600" />
            Languages
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.languages.map((lang, index) => (
              <span
                key={index}
                className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Code className="h-5 w-5 text-purple-600" />
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Work Background */}
      {profile?.work_background && (profile.work_background.company || profile.work_background.position) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-orange-600" />
            Work Background
          </h2>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.work_background.company && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <div className="text-gray-900">{profile.work_background.company}</div>
                </div>
              )}
              {profile.work_background.position && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <div className="text-gray-900">{profile.work_background.position}</div>
                </div>
              )}
              {(profile.work_background.start_date || profile.work_background.end_date) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <div className="text-gray-900">
                    {profile.work_background.start_date ? formatDate(profile.work_background.start_date) : "N/A"}
                    {" - "}
                    {profile.work_background.end_date ? formatDate(profile.work_background.end_date) : "Present"}
                  </div>
                </div>
              )}
              {profile.work_background.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <div className="text-gray-900 whitespace-pre-wrap">{profile.work_background.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      {profile?.preferences && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mentorship Preferences</h2>
          {profile.preferences.mentor_qualities && profile.preferences.mentor_qualities.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Mentor Qualities</label>
              <div className="flex flex-wrap gap-2">
                {profile.preferences.mentor_qualities.map((quality, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                  >
                    {quality}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.preferences.session_type && profile.preferences.session_type.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Session Types</label>
              <div className="flex flex-wrap gap-2">
                {profile.preferences.session_type.map((type, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.preferences.preferred_time_windows && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time Windows</label>
              <div className="flex flex-wrap gap-2">
                {profile.preferences.preferred_time_windows.morning && (
                  <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Morning</span>
                )}
                {profile.preferences.preferred_time_windows.afternoon && (
                  <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Afternoon</span>
                )}
                {profile.preferences.preferred_time_windows.evening && (
                  <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Evening</span>
                )}
                {profile.preferences.preferred_time_windows.weekend && (
                  <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Weekend</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          Account Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <div className="text-gray-900">
              {profile?.timezone || "Asia/Kolkata"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
            <div className="text-gray-900">
              {formatDate(profile?.created_at)}
            </div>
          </div>

          {profile?.updated_at && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
              <div className="text-gray-900">
                {formatDate(profile.updated_at)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume */}
      {profile?.resume_url && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Resume
          </h2>
          <a
            href={profile.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Resume
          </a>
        </div>
      )}

      {/* Social Media & Portfolio Links */}
      {(profile?.linkedin_url || profile?.github_url || profile?.instagram_url || profile?.portfolio_url) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            Links
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {profile?.linkedin_url && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-sm font-bold">in</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">LinkedIn</p>
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm truncate block"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            )}

            {profile?.github_url && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                  <span className="text-white text-sm font-bold">GH</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">GitHub</p>
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800 text-sm truncate block"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            )}

            {profile?.instagram_url && (
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                  <span className="text-white text-sm font-bold">IG</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Instagram</p>
                  <a
                    href={profile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-800 text-sm truncate block"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            )}

            {profile?.portfolio_url && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Portfolio</p>
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800 text-sm truncate block"
                  >
                    View Portfolio
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
