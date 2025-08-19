#!/usr/bin/env python3

from setuptools import setup, find_packages
import pathlib

here = pathlib.Path(__file__).parent.resolve()

# Get the long description from the README file
long_description = (here.parent / 'README.md').read_text(encoding='utf-8')

setup(
    name='fileforge',
    version='1.0.0',
    description='Framework avançado de conversão de arquivos multi-formato',
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/julioamorimdev/FileForge',
    author='Julio Amorim',
    author_email='contato@julioamorim.com.br',
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Intended Audience :: Developers',
        'Topic :: Software Development :: Libraries :: Python Modules',
        'Topic :: Multimedia :: Graphics :: Graphics Conversion',
        'Topic :: Office/Business :: Office Suites',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
    ],
    keywords='file-conversion multi-format pdf docx image audio video ocr metadata batch-conversion',
    packages=find_packages(),
    python_requires='>=3.8',
    install_requires=[
        'Pillow>=10.0.0',
        'PyPDF2>=3.0.0',
        'python-docx>=1.1.0',
        'openpyxl>=3.1.0',
        'markdown>=3.5.0',
        'beautifulsoup4>=4.12.0',
        'pytesseract>=0.3.10',
        'moviepy>=1.0.3',
        'pydub>=0.25.1',
        'requests>=2.31.0',
        'click>=8.1.0',
        'tqdm>=4.66.0',
        'aiofiles>=23.2.1',
        'aiohttp>=3.9.0',
        'python-magic>=0.4.27',
    ],
    extras_require={
        'dev': [
            'pytest>=7.4.0',
            'pytest-asyncio>=0.21.0',
            'pytest-cov>=4.1.0',
            'black>=23.0.0',
            'flake8>=6.0.0',
            'mypy>=1.7.0',
            'pre-commit>=3.6.0',
        ],
        'ai': [
            'openai>=1.6.0',
            'transformers>=4.36.0',
        ],
        'full': [
            'opencv-python>=4.8.0',
            'scikit-image>=0.22.0',
            'librosa>=0.10.0',
        ]
    },
    entry_points={
        'console_scripts': [
            'fileforge=fileforge.cli:main',
        ],
    },
    project_urls={
        'Bug Reports': 'https://github.com/julioamorimdev/FileForge/issues',
        'Source': 'https://github.com/julioamorimdev/FileForge',
        'Documentation': 'https://github.com/julioamorimdev/FileForge/wiki',
    },
)
